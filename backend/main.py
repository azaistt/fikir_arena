import asyncio
import hashlib
import json
import math
import os
import re
import time
import unicodedata
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import urlopen

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients: list[WebSocket] = []
POLL_DURATION_SECONDS = 60

state = {
    "active": None,
    "queue": [],
    "rejected": [],
    "overflow_total": 0,
    "overflow_by_source": {
        "QR": 0,
        "YouTube": 0,
    },
}

poll_ideas = [
    {
        "id": "idea-1",
        "text": "Canlı izleyici desteğiyle ürün sunumu.",
    },
    {
        "id": "idea-2",
        "text": "QR fikirleriyle gerçek zamanlı görev turu.",
    },
    {
        "id": "idea-3",
        "text": "Finalistler için şehir bazlı oy haritası.",
    },
]

poll_state = {
    "session_id": 1,
    "active": False,
    "votes": {idea["id"]: 0 for idea in poll_ideas},
    "voters": {},
    "started_at": None,
    "ends_at": None,
    "updated_at": time.time(),
}

next_id = 1
seen_hashes: set[str] = set()
last_submit_by_user: dict[str, float] = {}
approved_history: list[dict] = []
seen_users: set[str] = set()

# Legacy (kept only for migration trace; not used in runtime policy).
LEGACY_BLACKLIST_PATTERNS = [
    r"\bspam\b",
    r"\byasak\b",
    r"\bkufur\b",
    r"\bküfür\b",
]
LEGACY_RED_POLICY_PATTERNS = [
    r"\b(hakaret|kufur|kÃ¼fÃ¼r|nefret)\b",
    r"\b(tc kimlik|kimlik no|ev adresi|adresim)\b",
    r"\b(telefon|gsm|tel)\b[:=]?\s*\+?\d{9,14}\b",
    r"\b(cocuk|Ã§ocuk|14 yas|15 yas|16 yas|17 yas)\b.*\b(cinsel|seksi)\b",
]
LEGACY_YELLOW_POLICY_PATTERNS = [
    r"\b(cocuk|Ã§ocuk|lise|ortaokul|18 alti|14 yas|15 yas|16 yas|17 yas)\b",
    r"\b(intihar|istismar|travma|siddet|ÅŸiddet)\b",
]
RATE_LIMIT_SECONDS = 2
YOUTUBE_RATE_LIMIT_SECONDS = 15
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/liveChat/messages"
YOUTUBE_VIDEOS_API_URL = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_SEEN_LIMIT = 20000
QUEUE_LIMIT = 150
STRICT_BLOCK_YELLOW = os.getenv("STRICT_BLOCK_YELLOW", "1").strip() != "0"

# Canonical moderation regex set (ascii folded text).
BLACKLIST_PATTERNS = [
    r"\bspam\b",
    r"\byasak\b",
    r"\bkufur\b",
]
RED_POLICY_PATTERNS = [
    r"\b(hakaret|kufur|nefret)\b",
    r"\b(tc kimlik|kimlik no|ev adresi|adresim)\b",
    r"\b(telefon|gsm|tel)\b[:=]?\s*(?:\+?\d[\d\s\-]{8,16}\d)\b",
    r"\b(cocuk|14 yas|15 yas|16 yas|17 yas)\b.*\b(cinsel|seksi)\b",
]
YELLOW_POLICY_PATTERNS = [
    r"\b(cocuk|lise|ortaokul|18 alti|14 yas|15 yas|16 yas|17 yas)\b",
    r"\b(intihar|istismar|travma|siddet)\b",
]

youtube_state = {
    "enabled": bool(
        os.getenv("YOUTUBE_API_KEY", "").strip()
        and os.getenv("YOUTUBE_LIVE_CHAT_ID", "").strip()
    ),
    "api_key": os.getenv("YOUTUBE_API_KEY", "").strip(),
    "video_id": "",
    "live_chat_id": os.getenv("YOUTUBE_LIVE_CHAT_ID", "").strip(),
    "next_page_token": None,
    "polling_interval_ms": 2000,
    "status": "disabled",
    "last_error": "",
    "last_sync_at": None,
    "seen_message_ids": set(),
}
youtube_task: asyncio.Task | None = None


def normalize_text(value: str) -> str:
    text = str(value or "").strip().lower()
    text = text.replace("ı", "i")
    decomposed = unicodedata.normalize("NFKD", text)
    without_marks = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return " ".join(without_marks.split())


def text_hash(text: str) -> str:
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()


def mark_youtube_message_seen(message_id: str) -> bool:
    seen_ids = youtube_state["seen_message_ids"]

    if message_id in seen_ids:
        return False

    if len(seen_ids) >= YOUTUBE_SEEN_LIMIT:
        seen_ids.clear()

    seen_ids.add(message_id)
    return True


def _parse_youtube_http_error(exc: HTTPError) -> str:
    try:
        body = json.loads(exc.read().decode("utf-8"))
        message = body.get("error", {}).get("message", "")
    except Exception:
        message = ""

    if exc.code == 403:
        if "quota" in message.lower():
            return "YouTube API günlük kotası aşıldı. Yarın tekrar deneyin veya Google Cloud'dan kota artırın."
        return f"YouTube API erişim reddedildi (403). API key'in YouTube Data API v3 yetkisi var mı? Hata: {message or 'Forbidden'}"
    if exc.code == 400:
        return f"Geçersiz istek (400). Video ID doğru mu? Hata: {message or 'Bad Request'}"
    return f"YouTube API hatası ({exc.code}): {message or exc.reason}"


def fetch_live_chat_id_from_video(api_key: str, video_id: str) -> str:
    params = {
        "part": "liveStreamingDetails",
        "id": video_id,
        "key": api_key,
    }
    request_url = f"{YOUTUBE_VIDEOS_API_URL}?{urlencode(params)}"
    try:
        with urlopen(request_url, timeout=15) as response:
            payload = response.read().decode("utf-8")
    except HTTPError as exc:
        raise ValueError(_parse_youtube_http_error(exc)) from exc
    data = json.loads(payload)
    items = data.get("items", [])
    if not items:
        raise ValueError("Video bulunamadı. Video ID'yi kontrol et (URL'deki ?v= kısmı).")
    live_chat_id = items[0].get("liveStreamingDetails", {}).get("activeLiveChatId", "")
    if not live_chat_id:
        raise ValueError("Bu videoda aktif canlı sohbet bulunamadı. Video şu an canlı yayında mı?")
    return live_chat_id


def fetch_youtube_messages_page(
    api_key: str,
    live_chat_id: str,
    page_token: str | None,
) -> dict:
    params = {
        "liveChatId": live_chat_id,
        "part": "id,snippet,authorDetails",
        "maxResults": 200,
        "key": api_key,
    }

    if page_token:
        params["pageToken"] = page_token

    request_url = f"{YOUTUBE_API_URL}?{urlencode(params)}"

    with urlopen(request_url, timeout=15) as response:
        payload = response.read().decode("utf-8")

    return json.loads(payload)


def get_rate_limit_seconds(source: str) -> int:
    if normalize_text(source) == "youtube":
        return YOUTUBE_RATE_LIMIT_SECONDS

    return RATE_LIMIT_SECONDS


def enqueue_pending_item(item: dict) -> None:
    if len(state["queue"]) >= QUEUE_LIMIT:
        dropped = state["queue"].pop(0)
        dropped_source = str(dropped.get("source") or "QR")

        state["overflow_total"] += 1
        state["overflow_by_source"][dropped_source] = (
            state["overflow_by_source"].get(dropped_source, 0) + 1
        )

    state["queue"].append(item)


def automatic_filter(user: str, text: str, source: str = "QR") -> tuple[bool, str | None]:
    normalized_text = normalize_text(text)
    normalized_user = normalize_text(user)
    now = time.time()

    for pattern in BLACKLIST_PATTERNS:
        if re.search(pattern, normalized_text, re.IGNORECASE):
            return False, "blacklist"

    current_hash = text_hash(text)
    if current_hash in seen_hashes:
        return False, "duplicate"

    source_key = normalize_text(source) or "qr"
    rate_key = f"{source_key}:{normalized_user}"
    last_submit = last_submit_by_user.get(rate_key)
    rate_limit_seconds = get_rate_limit_seconds(source)
    if last_submit and now - last_submit < rate_limit_seconds:
        return False, "rate_limit"

    seen_hashes.add(current_hash)
    last_submit_by_user[rate_key] = now
    return True, None


def soft_ai_moderation(text: str) -> dict:
    normalized_text = normalize_text(text)

    if any(word in normalized_text for word in ["sacma", "saçma", "nefret"]):
        return {
            "label": "risky",
            "reason": "Needs human review",
        }

    return {
        "label": "safe",
        "reason": "",
    }


def content_policy_moderation(text: str) -> dict:
    normalized_text = normalize_text(text)

    for pattern in RED_POLICY_PATTERNS:
        if re.search(pattern, normalized_text, re.IGNORECASE):
            return {
                "label": "reject",
                "reason": "policy_red",
            }

    for pattern in YELLOW_POLICY_PATTERNS:
        if re.search(pattern, normalized_text, re.IGNORECASE):
            return {
                "label": "risky",
                "reason": "policy_yellow",
            }

    return soft_ai_moderation(text)


def should_block_before_queue(moderation: dict) -> tuple[bool, str | None]:
    label = str(moderation.get("label") or "").strip().lower()
    reason = str(moderation.get("reason") or "").strip()

    if label == "reject":
        return True, reason or "policy_red"

    if label == "risky" and STRICT_BLOCK_YELLOW:
        return True, reason or "policy_yellow_blocked"

    return False, None


def append_rejected_item(
    source: str,
    user: str,
    text: str,
    reason: str,
    moderation: dict | None = None,
    external_id: str = "",
) -> dict:
    global next_id

    rejected_item = {
        "id": next_id,
        "source": source,
        "user": user,
        "text": text,
        "status": "rejected",
        "reason": reason,
        "created_at": time.time(),
    }

    if external_id:
        rejected_item["external_id"] = external_id

    if moderation:
        rejected_item["moderation"] = moderation

    next_id += 1
    state["rejected"].append(rejected_item)
    return rejected_item


# normalize_text Türkçe karakterleri ASCII'ye katlar (ü→u, ş→s, vb.)
# Bu yüzden map'teki değerler normalize edilmiş halde yazılmıştır.
# Örnek: "üçüncü" → normalize_text → "ucuncu"
_YOUTUBE_VOTE_MAP: dict[str, int] = {
    # Fikir 1
    "1": 0, "!1": 0,
    "birinci": 0,
    "fikir 1": 0,
    "fikir bir": 0,
    # Fikir 2
    "2": 1, "!2": 1,
    "ikinci": 1,
    "fikir 2": 1,
    "fikir iki": 1,
    # Fikir 3  ("üçüncü"→"ucuncu", "üç"→"uc", "fikir üç"→"fikir uc")
    "3": 2, "!3": 2,
    "ucuncu": 2,
    "uc": 2,
    "fikir 3": 2,
    "fikir uc": 2,
}


def parse_youtube_vote(text: str) -> int | None:
    """Return 0-based idea index if text is a vote command, else None."""
    return _YOUTUBE_VOTE_MAP.get(normalize_text(text))


async def process_youtube_vote(idea_index: int, user: str, channel_id: str) -> None:
    """Register a YouTube vote into poll_state and broadcast if poll is active."""
    if not poll_state["active"]:
        return

    if idea_index >= len(poll_ideas):
        return

    idea_id = poll_ideas[idea_index]["id"]
    voter_id = f"yt:{channel_id}"

    if voter_id in poll_state["voters"]:
        return

    poll_state["voters"][voter_id] = {
        "idea_id": idea_id,
        "user": user[:40],
        "created_at": time.time(),
        "source": "YouTube",
    }
    poll_state["votes"][idea_id] += 1
    poll_state["updated_at"] = time.time()

    await broadcast_poll_state()


async def ingest_youtube_message(item: dict) -> None:
    global next_id

    message_id = str(item.get("id") or "").strip()
    snippet = item.get("snippet") or {}
    author = item.get("authorDetails") or {}

    if not message_id or not mark_youtube_message_seen(message_id):
        return

    if snippet.get("type") != "textMessageEvent":
        return

    text = str(snippet.get("displayMessage") or "").strip()
    user = str(author.get("displayName") or "").strip()

    if not user or not text:
        return

    # Oylama aktifse oy komutu kontrolü (queue'ya girmez)
    if poll_state["active"]:
        idea_index = parse_youtube_vote(text)
        if idea_index is not None:
            channel_id = str(author.get("channelId") or message_id).strip()
            await process_youtube_vote(idea_index, user, channel_id)
            return

    is_allowed, reason = automatic_filter(user, text, source="YouTube")
    if not is_allowed:
        append_rejected_item(
            source="YouTube",
            user=user,
            text=text,
            reason=reason or "auto_filter",
            external_id=message_id,
        )
        return

    moderation = content_policy_moderation(text)
    should_block, block_reason = should_block_before_queue(moderation)
    if should_block:
        append_rejected_item(
            source="YouTube",
            user=user,
            text=text,
            reason=block_reason or "policy_blocked",
            moderation=moderation,
            external_id=message_id,
        )
        return

    queue_item = {
        "id": next_id,
        "source": "YouTube",
        "user": user,
        "text": text,
        "status": "pending",
        "moderation": moderation,
        "created_at": time.time(),
        "external_id": message_id,
    }
    next_id += 1
    seen_users.add(normalize_text(user))
    enqueue_pending_item(queue_item)


async def youtube_ingest_loop() -> None:
    while True:
        if not youtube_state["enabled"]:
            youtube_state["status"] = "disabled"
            await asyncio.sleep(3)
            continue

        try:
            payload = await asyncio.to_thread(
                fetch_youtube_messages_page,
                youtube_state["api_key"],
                youtube_state["live_chat_id"],
                youtube_state["next_page_token"],
            )
            items = payload.get("items", [])

            for item in items:
                await ingest_youtube_message(item)

            youtube_state["next_page_token"] = (
                payload.get("nextPageToken") or youtube_state["next_page_token"]
            )
            youtube_state["polling_interval_ms"] = int(
                payload.get("pollingIntervalMillis")
                or youtube_state["polling_interval_ms"]
                or 2000
            )
            youtube_state["status"] = "running"
            youtube_state["last_error"] = ""
            youtube_state["last_sync_at"] = time.time()

            wait_seconds = max(1.0, youtube_state["polling_interval_ms"] / 1000)
            await asyncio.sleep(wait_seconds)
        except Exception as exc:
            youtube_state["status"] = "error"
            youtube_state["last_error"] = str(exc)[:220]
            await asyncio.sleep(5)


def normalize_youtube_config_value(value: str) -> str:
    return str(value or "").strip()


def connect_youtube(api_key: str, video_id: str, live_chat_id: str) -> None:
    youtube_state["api_key"] = normalize_youtube_config_value(api_key)
    youtube_state["video_id"] = normalize_youtube_config_value(video_id)
    youtube_state["live_chat_id"] = normalize_youtube_config_value(live_chat_id)

    youtube_state["enabled"] = bool(
        youtube_state["api_key"] and youtube_state["live_chat_id"]
    )
    youtube_state["status"] = "connecting" if youtube_state["enabled"] else "disabled"
    youtube_state["last_error"] = ""
    youtube_state["last_sync_at"] = None
    youtube_state["next_page_token"] = None
    youtube_state["seen_message_ids"].clear()


def disconnect_youtube() -> None:
    youtube_state["enabled"] = False
    youtube_state["api_key"] = ""
    youtube_state["video_id"] = ""
    youtube_state["live_chat_id"] = ""
    youtube_state["status"] = "disabled"
    youtube_state["last_error"] = ""
    youtube_state["last_sync_at"] = None
    youtube_state["next_page_token"] = None
    youtube_state["seen_message_ids"].clear()


@app.on_event("startup")
async def start_youtube_worker():
    global youtube_task

    if youtube_task is None:
        youtube_task = asyncio.create_task(youtube_ingest_loop())


@app.on_event("shutdown")
async def stop_youtube_worker():
    global youtube_task

    if youtube_task is not None:
        youtube_task.cancel()
        try:
            await youtube_task
        except asyncio.CancelledError:
            pass
        youtube_task = None


async def broadcast_event(event: dict) -> None:
    disconnected_clients = []

    for client in connected_clients.copy():
        try:
            await client.send_json(event)
        except Exception:
            disconnected_clients.append(client)

    for client in disconnected_clients:
        if client in connected_clients:
            connected_clients.remove(client)


def public_poll_state() -> dict:
    refresh_poll_timeout()
    total_votes = sum(poll_state["votes"].values())
    ideas = []
    remaining_seconds = 0

    if poll_state["active"] and poll_state["ends_at"]:
        remaining_seconds = max(0, math.ceil(poll_state["ends_at"] - time.time()))

    for idea in poll_ideas:
        votes = poll_state["votes"].get(idea["id"], 0)
        percent = round((votes / total_votes) * 100) if total_votes else 0
        ideas.append(
            {
                **idea,
                "votes": votes,
                "percent": percent,
            }
        )

    return {
        "session_id": poll_state["session_id"],
        "active": poll_state["active"],
        "duration_seconds": POLL_DURATION_SECONDS,
        "remaining_seconds": remaining_seconds,
        "total_votes": total_votes,
        "ideas": ideas,
        "updated_at": poll_state["updated_at"],
    }


async def broadcast_poll_state() -> None:
    await broadcast_event(
        {
            "type": "poll_update",
            "poll": public_poll_state(),
        }
    )


def reset_poll_votes() -> None:
    poll_state["votes"] = {idea["id"]: 0 for idea in poll_ideas}
    poll_state["voters"] = {}
    poll_state["started_at"] = None
    poll_state["ends_at"] = None
    poll_state["updated_at"] = time.time()


def refresh_poll_timeout() -> None:
    if (
        poll_state["active"]
        and poll_state["ends_at"]
        and time.time() >= poll_state["ends_at"]
    ):
        poll_state["active"] = False
        poll_state["ends_at"] = None
        poll_state["updated_at"] = time.time()


async def close_poll_when_time_ends(session_id: int) -> None:
    await asyncio.sleep(POLL_DURATION_SECONDS)

    if poll_state["session_id"] == session_id and poll_state["active"]:
        poll_state["active"] = False
        poll_state["ends_at"] = None
        poll_state["updated_at"] = time.time()
        await broadcast_poll_state()


@app.get("/")
def root():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


@app.get("/message")
def get_message():
    return {"item": state["active"]}


@app.get("/youtube/status")
def get_youtube_status():
    return {
        "enabled": youtube_state["enabled"],
        "status": youtube_state["status"],
        "video_id": youtube_state["video_id"],
        "live_chat_id": youtube_state["live_chat_id"],
        "last_error": youtube_state["last_error"],
        "last_sync_at": youtube_state["last_sync_at"],
    }


@app.post("/youtube/connect")
def connect_youtube_chat(data: dict):
    api_key = normalize_youtube_config_value(data.get("api_key"))
    video_id = normalize_youtube_config_value(data.get("video_id"))

    if not api_key or not video_id:
        raise HTTPException(
            status_code=400,
            detail="api_key and video_id are required",
        )

    try:
        live_chat_id = fetch_live_chat_id_from_video(api_key, video_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"YouTube API hatası: {str(exc)[:200]}")

    connect_youtube(api_key, video_id, live_chat_id)
    return get_youtube_status()


@app.post("/youtube/disconnect")
def disconnect_youtube_chat():
    disconnect_youtube()
    return get_youtube_status()


@app.get("/poll")
def get_poll():
    return public_poll_state()


@app.post("/poll/reset")
async def reset_poll():
    poll_state["session_id"] += 1
    poll_state["active"] = False
    reset_poll_votes()
    await broadcast_poll_state()
    return public_poll_state()


@app.post("/poll/start")
async def start_poll():
    if not poll_state["active"]:
        now = time.time()
        poll_state["active"] = True
        poll_state["started_at"] = now
        poll_state["ends_at"] = now + POLL_DURATION_SECONDS
        poll_state["updated_at"] = now
        asyncio.create_task(close_poll_when_time_ends(poll_state["session_id"]))

    await broadcast_poll_state()
    return public_poll_state()


@app.post("/poll/close")
async def close_poll():
    poll_state["active"] = False
    poll_state["ends_at"] = None
    poll_state["updated_at"] = time.time()
    await broadcast_poll_state()
    return public_poll_state()


@app.post("/vote")
async def submit_vote(data: dict):
    idea_id = str(data.get("idea_id") or "").strip()
    voter_id = str(data.get("voter_id") or "").strip()
    user = str(data.get("user") or "").strip()

    if not poll_state["active"]:
        raise HTTPException(status_code=409, detail="Poll is not active")

    if idea_id not in poll_state["votes"]:
        raise HTTPException(status_code=400, detail="Unknown idea")

    if not voter_id:
        raise HTTPException(status_code=400, detail="Voter id is required")

    if voter_id in poll_state["voters"]:
        return {
            "status": "already_voted",
            "selected_idea_id": poll_state["voters"][voter_id]["idea_id"],
            "poll": public_poll_state(),
        }

    poll_state["voters"][voter_id] = {
        "idea_id": idea_id,
        "user": user[:40],
        "created_at": time.time(),
    }
    poll_state["votes"][idea_id] += 1
    poll_state["updated_at"] = time.time()

    await broadcast_poll_state()

    return {
        "status": "voted",
        "selected_idea_id": idea_id,
        "poll": public_poll_state(),
    }


@app.post("/submit")
def submit_message(data: dict):
    global next_id

    user = str(data.get("user") or data.get("name") or "").strip()
    text = str(data.get("text") or data.get("message") or "").strip()

    if not user or not text:
        raise HTTPException(status_code=400, detail="User and text are required")

    is_allowed, reason = automatic_filter(user, text, source="QR")
    if not is_allowed:
        rejected_item = append_rejected_item(
            source="QR",
            user=user,
            text=text,
            reason=reason or "auto_filter",
        )
        return {
            "status": "rejected",
            "reason": reason,
            "item": rejected_item,
        }

    moderation = content_policy_moderation(text)
    should_block, block_reason = should_block_before_queue(moderation)
    if should_block:
        rejected_item = append_rejected_item(
            source="QR",
            user=user,
            text=text,
            reason=block_reason or "policy_blocked",
            moderation=moderation,
        )
        return {
            "status": "rejected",
            "reason": block_reason or "policy_blocked",
            "item": rejected_item,
        }

    item = {
        "id": next_id,
        "source": "QR",
        "user": user,
        "text": text,
        "status": "pending",
        "moderation": moderation,
        "created_at": time.time(),
    }
    next_id += 1
    seen_users.add(normalize_text(user))
    enqueue_pending_item(item)

    return {"status": "queued", "item": item}


@app.get("/queue")
def get_queue():
    return {
        "queue": state["queue"],
        "queue_limit": QUEUE_LIMIT,
        "overflow_total": state["overflow_total"],
        "overflow_by_source": state["overflow_by_source"],
    }


async def generate_display_texts(text: str) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    short_fallback = (text[:97] + "...") if len(text) > 100 else text
    if not api_key:
        return {"display_text": short_fallback, "presenter_text": text}

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = await asyncio.to_thread(
            client.messages.create,
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=(
                "Sen bir canlı yayın asistanısın. "
                "Verilen Türkçe izleyici mesajı için iki versiyon üret ve SADECE JSON döndür, başka hiçbir şey ekleme:\n"
                "1. display_text: Overlay ekranı için maksimum 80 karakter özet. Tek satırda sığacak şekilde yaz, kesinlikle 80 karakteri geçme. Ana fikri koru, etkileyici yaz.\n"
                "2. presenter_text: Yazım ve noktalama hatalarını düzelt, metnin tamamını koru.\n"
                'Format: {"display_text": "...", "presenter_text": "..."}'
            ),
            messages=[{"role": "user", "content": text}],
        )
        raw = next((b.text for b in response.content if b.type == "text"), "")
        match = re.search(r'\{[^{}]*"display_text"[^{}]*\}', raw, re.DOTALL)
        data = json.loads(match.group() if match else raw.strip())
        return {
            "display_text": str(data.get("display_text") or short_fallback)[:80],
            "presenter_text": str(data.get("presenter_text") or text)[:500],
        }
    except Exception:
        return {"display_text": short_fallback, "presenter_text": text}


@app.post("/approve")
async def approve_message(data: dict):
    item_id = data.get("id")
    override_text = str(data.get("text") or "").strip()

    for index, item in enumerate(state["queue"]):
        if item["id"] == item_id:
            approved_item = state["queue"].pop(index)
            if override_text:
                approved_item["original_text"] = approved_item["text"]
                approved_item["text"] = override_text[:240]
            approved_item["status"] = "approved"

            ai_texts = await generate_display_texts(approved_item["text"])
            approved_item["display_text"] = ai_texts["display_text"]
            approved_item["presenter_text"] = ai_texts["presenter_text"]

            state["active"] = approved_item
            approved_history.append(approved_item)
            if len(approved_history) > 4:
                approved_history.pop(0)

            await broadcast_event(
                {
                    "type": "idea_approved",
                    "item": approved_item,
                }
            )

            return {"status": "approved", "item": approved_item}

    raise HTTPException(status_code=404, detail="Message not found")


@app.post("/reject")
def reject_message(data: dict):
    item_id = data.get("id")

    for index, item in enumerate(state["queue"]):
        if item["id"] == item_id:
            rejected_item = state["queue"].pop(index)
            rejected_item["status"] = "rejected"
            rejected_item["reason"] = "human_reject"
            state["rejected"].append(rejected_item)
            return {"status": "rejected", "item": rejected_item}

    raise HTTPException(status_code=404, detail="Message not found")


@app.post("/ai/clean")
async def ai_clean_message(data: dict):
    text = str(data.get("text") or "").strip()

    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY tanımlı değil.")

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = await asyncio.to_thread(
            client.messages.create,
            model="claude-haiku-4-5",
            max_tokens=256,
            system=(
                "Sen bir canlı yayın moderatörü asistanısın. "
                "Sana verilen izleyici mesajını yazım, noktalama ve netlik açısından düzelt. "
                "Mesajın anlamını ve tonunu koru. "
                "Sadece düzeltilmiş metni döndür, açıklama ekleme."
            ),
            messages=[{"role": "user", "content": text}],
        )
        suggestion = next(
            (block.text for block in response.content if block.type == "text"), text
        )
        return {"suggestion": suggestion.strip()}
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Geçersiz Anthropic API key.")
    except anthropic.APIStatusError as exc:
        raise HTTPException(status_code=502, detail=f"AI API hatası: {exc.message[:200]}")


@app.get("/overlay/data")
def get_overlay_data():
    return {
        "messages": approved_history[-4:],
        "total_ideas": next_id - 1,
        "participant_count": len(seen_users),
    }
