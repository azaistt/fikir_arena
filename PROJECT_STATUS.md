# Fikir Arena — Proje Durum Belgesi

**Son güncelleme:** 2026-04-30
**Kural: Bu dosyayı okumadan hiçbir değişiklik yapma.**

---

## 1. Sistem Özeti

**Fikrini Sat** — canlı TV yayını için izleyici odaklı karar motoru.
İzleyiciler fikir gönderir → operatör moderasyon yapar → izleyici oylar → AI analiz eder → sonuç overlay'e yansır.

### Akış

```
İzleyici
  ├── QR Kod → /join (Next.js, fikir_arena) → POST /submit
  ├── YouTube Live Chat → YouTube API → ingest_youtube_message()
  └── Web Sitesi → join-section.jsx → POST /submit
          │
          ▼
    FastAPI Backend (Railway)
    https://fikirarena-production.up.railway.app
          │
    Moderation Pipeline
    (Blacklist → Content Policy → AI Soft Filter)
          │
          ▼
    Admin Paneli (interactive-live-system, local)
    http://localhost:5173/admin
    Operatör: Onayla / Reddet
          │
          ▼
    /approve → generate_display_texts() [Claude Haiku]
         ├── display_text (≤80 kar, kelime sınırında, overlay)
         └── presenter_text (tam, yazım düzeltilmiş, ≤500 kar)
          │
     ┌────┴──────────────┐
     ▼                   ▼
/overlay             /presenter
(vMix, 4K)          (Sunucu monitörü)
local:5173/overlay  fikir_arena/presenter
her 3s poll         her 5s poll
```

---

## 2. Repolar ve Sorumluluklar

### Repo A: `X:\interactive-live-system` (LOCAL ONLY — git yok)

Operatör iş istasyonunda çalışan araçlar. Railway'e deploy edilmez.

```
interactive-live-system/
├── backend/
│   └── main.py              ← KAYNAK GERÇEK — Railway'e bu deploy edilir
│                              (fikir_arena/backend/main.py'ye kopyalanır)
├── frontend/
│   ├── src/
│   │   ├── api.js           ← API = "https://fikirarena-production.up.railway.app"
│   │   ├── App.jsx          ← Router: /admin /join /overlay /overlay/decision
│   │   ├── pages/
│   │   │   ├── Admin.jsx    ← Operatör paneli
│   │   │   ├── Admin.css
│   │   │   ├── Join.jsx     ← Lokal test için /join
│   │   │   ├── Join.css
│   │   │   ├── Overlay.jsx  ← /overlay (4K, şeffaf, vMix)
│   │   │   └── Decision.jsx ← /overlay/decision (1080p, şeffaf, vMix)
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   └── MessageModerationCard.jsx
│   │   │   ├── live-flow/
│   │   │   │   ├── OverlayLive.jsx      ← 4K overlay layout
│   │   │   │   ├── TopIdeasList.jsx
│   │   │   │   ├── LiveFlowList.jsx
│   │   │   │   ├── IdeaCard.jsx
│   │   │   │   └── MessageCard.jsx
│   │   │   └── decision-overlay/
│   │   │       ├── DecisionOverlay.jsx  ← 1080p karar overlay
│   │   │       ├── AiAnalysis.jsx
│   │   │       ├── IdeaCard.jsx
│   │   │       └── PollBar.jsx
│   │   ├── utils/
│   │   │   └── overlayChannel.js        ← BroadcastChannel (admin↔overlay sync)
│   │   └── i18n/
│   │       └── tr.js                    ← Tüm Türkçe string'ler + mock data
│   └── vite.config.js
└── launcher.py / start-gui.bat          ← Backend başlatıcı
```

**Backend başlatma:** `python launcher.py` veya `start-gui.bat`
**Frontend başlatma:** `cd frontend && npm run dev` → http://localhost:5173

### Repo B: `X:\fikir_arena` — https://github.com/azaistt/fikir_arena (Railway + Vercel)

Herkese açık servisler. Değişiklik bu repoya commit + push edilir.

```
fikir_arena/
├── backend/
│   ├── main.py              ← interactive-live-system/backend/main.py'nin KOPYASI
│   │                          Değişiklik yapılacaksa KAYNAK'ı (interactive-live-system) düzenle,
│   │                          sonra buraya kopyala, commit, push yap.
│   └── requirements.txt     ← fastapi, uvicorn, websockets, anthropic, python-dotenv
├── app/                     ← Next.js App Router
│   ├── layout.jsx
│   ├── page.jsx             ← Landing page
│   ├── globals.css
│   ├── join/
│   │   └── page.jsx         ← /join — QR fikir gönderme formu
│   └── presenter/
│       └── page.jsx         ← /presenter — Sunucu monitörü
├── components/              ← Landing page bileşenleri
│   ├── landing-page.jsx
│   ├── hero-section.jsx
│   ├── join-section.jsx     ← Web sitesi üzerinden fikir gönderme
│   ├── flow-section.jsx
│   ├── breakdown-section.jsx
│   ├── live-experience-section.jsx
│   ├── state-flow-section.jsx
│   ├── mock-visual.jsx
│   └── site-footer.jsx
├── lib/
│   └── site-content.js      ← Tüm landing page metin içeriği
├── public/
│   └── media/
│       ├── fikir-arena-logo-full.png
│       ├── fikir-arena-logo.png
│       ├── lower-third-frame.png
│       ├── red-corners.png
│       └── bos-fon.png
├── .env.local.example       ← NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
│                              Railway'de gerçek değer set edilmeli (aşağıya bak)
├── next.config.mjs
└── package.json             ← next@16, react@19, framer-motion, tailwindcss
```

---

## 3. Canlı Servisler

| Servis | URL | Platform | Durum |
|---|---|---|---|
| FastAPI Backend | https://fikirarena-production.up.railway.app | Railway | Canlı |
| Next.js Frontend | (Railway veya Vercel, aynı repo) | Railway/Vercel | Canlı |
| Admin Paneli | http://localhost:5173/admin | Local (Vite) | Local |
| Overlay (4K) | http://localhost:5173/overlay | Local (Vite) | Local |
| Decision Overlay | http://localhost:5173/overlay/decision | Local (Vite) | Local |
| /join (test) | http://localhost:5173/join | Local (Vite) | Local |

---

## 4. Backend API Endpoint Listesi

Tüm endpointler `https://fikirarena-production.up.railway.app` altında.
CORS: `allow_origins=["*"]` — tüm origin'lere açık.

### Genel

| Method | Path | Açıklama |
|---|---|---|
| GET | `/` | Healthcheck — `{"status": "ok"}` |
| WS | `/ws` | WebSocket — admin↔overlay realtime sync |

### Mesaj Akışı

| Method | Path | Body / Params | Açıklama |
|---|---|---|---|
| POST | `/submit` | `{user, text}` veya `{name, text}` | İzleyici fikir gönderir (QR/Web) |
| GET | `/queue` | — | Bekleyen mesaj listesi + overflow |
| POST | `/approve` | `{id, text}` | Mesajı onayla → AI ile display_text üretir |
| POST | `/reject` | `{id}` | Mesajı reddet |
| GET | `/message` | — | Aktif (yayındaki) mesajı döndürür |
| POST | `/ai/clean` | `{text}` | Tek mesaj için AI yazım düzeltme |

### Oylama

| Method | Path | Body | Açıklama |
|---|---|---|---|
| GET | `/poll` | — | Aktif poll durumu |
| POST | `/poll/reset` | — | Poll sıfırla, Top 3 göster |
| POST | `/poll/start` | — | Oylamayı başlat (60 saniye) |
| POST | `/poll/close` | — | Oylamayı kapat, sonucu göster |
| POST | `/vote` | `{idea_id, voter_id, user}` | Oy gönder |

### YouTube

| Method | Path | Body | Açıklama |
|---|---|---|---|
| GET | `/youtube/status` | — | YouTube bağlantı durumu |
| POST | `/youtube/connect` | `{api_key, video_id}` | YouTube Live Chat'e bağlan |
| POST | `/youtube/disconnect` | — | Bağlantıyı kes |

### Overlay

| Method | Path | Açıklama |
|---|---|---|
| GET | `/overlay/data` | Son 4 onaylı mesaj + toplam fikir + katılımcı sayısı |

---

## 5. Çalışan Özellikler (2026-04-30 İtibarıyla)

- YouTube Live Chat entegrasyonu (Video ID → auto Chat ID çözümü)
- YouTube chat oy ayrıştırıcı (1/2/3, birinci/ikinci/üçüncü, fikir 1/2/3)
- Claude Haiku AI mesaj düzeltme (`/ai/clean`)
- Onay sırasında otomatik AI `display_text` + `presenter_text` üretimi
- `display_text` kelime sınırında kırpma (`_truncate_at_word`, maks 80 karakter)
- `/join` sayfası: fikir gönderme → oylamasına → sonuç akışı
- `/presenter` sunucu monitörü: onaylanan mesajları büyük fontla gösterir
- Admin paneli: 3 panel sağ sidebar (Yayın Kontrolü / Canlı Mesaj / YouTube)
- Admin paneli: `100svh` tam sayfa, scroll yok, 1920×1080 optimize
- Overlay şeffaf arka plan (OBS/vMix browser source transparency)
- Overlay boyutları: `/overlay` = 3840×2160, `/overlay/decision` = 1920×1080
- BroadcastChannel ile admin↔overlay state senkronizasyonu
- State machine: Top3 → Poll → Sonuç (manuel, operatör kontrolünde)

---

## 6. Ortam Değişkenleri

### Railway (Backend)

| Değişken | Zorunlu | Durum | Not |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Evet | **EKSİK** | Claude Haiku için — yoksa fallback modda çalışır |
| `YOUTUBE_API_KEY` | Evet | Aktif | YouTube Data API v3 |
| `YOUTUBE_LIVE_CHAT_ID` | Hayır | Opsiyonel | Direkt Chat ID (yoksa Video ID'den çözülür) |
| `STRICT_BLOCK_YELLOW` | Hayır | Varsayılan `1` | `1` = sarı içeriği otomatik blokla |

### Railway/Vercel (Next.js Frontend)

| Değişken | Zorunlu | Mevcut Değer | Olması Gereken |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | **Evet** | **TANIM YOK** | `https://fikirarena-production.up.railway.app` |

> **KRİTİK:** `NEXT_PUBLIC_` prefix'li Next.js değişkenleri build sırasında bundle'a gömülür.
> Railway dashboard'unda set edilip **Redeploy** yapılmadan `/join` ve `/presenter` backend'e ulaşamaz.

---

## 7. DOKUNMA — Kritik Dosyalar

Aşağıdaki dosyalar çalışan sistemin temelini oluşturur. Değişiklik yapmadan önce etkisini tam anla.

### DOKUNMA — Yalnızca bilinçli değişiklik

| Dosya | Neden kritik |
|---|---|
| `interactive-live-system/backend/main.py` | Tüm backend mantığı buradadır. Her değişiklik `fikir_arena/backend/main.py`'ye kopyalanıp deploy edilmelidir. |
| `fikir_arena/backend/main.py` | Railway'de çalışan binary. Direkt düzenleme — interactive-live-system ile senkronizasyonu bozar. Kaynak repo'da değiştir, buraya kopyala. |
| `interactive-live-system/frontend/src/api.js` | Tüm API çağrılarının base URL'i. Yanlış URL tüm paneli koparır. |
| `interactive-live-system/frontend/src/utils/overlayChannel.js` | Admin↔overlay realtime sync. Bozulursa yayın kontrolü çalışmaz. |
| `interactive-live-system/frontend/src/i18n/tr.js` | Tüm Türkçe string'ler ve mock data. Eksik key → UI kırılır. |
| `fikir_arena/app/join/page.jsx` | QR ile açılan sayfa. `NEXT_PUBLIC_BACKEND_URL` kullanır — Railway env var olmadan çalışmaz. |

### DOKUNMA — Overlay boyutları ve şeffaflık

Overlay sayfaları (`Overlay.jsx`, `Decision.jsx`) `html`/`body` background'unu mount sırasında `transparent` yapıyor. Bu OBS/vMix için zorunlu. Sakın genel CSS sıfırlama ile geçersiz kılma.

| Overlay | Boyut | Arka Plan |
|---|---|---|
| `/overlay` | 3840×2160 | Şeffaf |
| `/overlay/decision` | 1920×1080 | Şeffaf |

---

## 8. Backend Deploy Akışı

```
1. interactive-live-system/backend/main.py'de değişiklik yap
2. Test et (python launcher.py ile lokal çalıştır)
3. cp interactive-live-system/backend/main.py fikir_arena/backend/main.py
4. cd X:/fikir_arena
5. git add backend/main.py
6. git commit -m "fix/feat: ..."
7. git push
→ Railway otomatik deploy başlatır
```

---

## 9. Bilinen Sorunlar / Yapılacaklar

### Kritik (Canlı Yayın Öncesi)

- [ ] `ANTHROPIC_API_KEY` Railway env'e eklenmeli — AI şu an fallback modda (display_text = ilk 80 kar)
- [ ] `NEXT_PUBLIC_BACKEND_URL` Railway/Vercel env'e set edilmeli → `https://fikirarena-production.up.railway.app`
- [ ] Gerçek QR görselini `/public/media/join-qr.png` olarak ekle, OverlayLive.jsx'te kullan
- [ ] vMix entegrasyon testi — `/overlay` browser input olarak aç, şeffaflık doğrula

### Tasarım

- [ ] Figma mockup — logo + design system (Bebas Neue/Oswald tipografi, `#FF1E1E` kırmızı)
- [ ] Overlay fade-in/fade-out animasyonları
- [ ] DESIGN-SYSTEM.md oluştur

### Özellik

- [ ] `interactive-live-system` için git repo kurulumu (şu an git yok)
- [ ] Overlay istatistikleri (fikir/katılımcı) backend restart'ta sıfırlanıyor — kalıcı sayaç
- [ ] Admin panelinde `display_text` onay sonrası düzenlenebilir olsun
- [ ] `/join` (interactive-live-system) `WS_URL` hardcoded `ws://localhost:8000/ws` — mobil için Railway WebSocket URL'ine çekilmeli
- [ ] `/presenter` sayfasına "en son onaylanan" tek mesaj vurgu modu ekle

---

## 10. State Machine

```
Collecting → Filtering → Shortlist → Poll → AI Analysis → Result
```

Tüm geçişler manueldir, admin panelinden operatör kontrolündedir.

**Karar ekranı akışı (sağ sidebar, 3 adım):**
1. **İlk 3** — `/poll/reset` → top 3 fikri göster, oyları sıfırla
2. **Oylama** — `/poll/start` → 60 saniyelik oylama başlar
3. **Sonuç** — `/poll/close` → oylamayı kapat, kazananı göster
