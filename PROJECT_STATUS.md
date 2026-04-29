# Fikir Arena — Proje Durum Raporu

**Son güncelleme:** 2026-04-29  
**Backend:** https://fikirarena-production.up.railway.app  
**Repo:** https://github.com/azaistt/fikir_arena

---

## Bugün Tamamlananlar (2026-04-29)

### 1. Backend — Yeni Endpoint'ler ve AI Sistemi

**`backend/main.py`** güncellendi, Railway'e deploy edildi.

#### `/overlay/data` (GET)
Son 4 onaylı mesajı, toplam fikir sayısını ve katılımcı sayısını döndürür.
```json
{
  "messages": [...],
  "total_ideas": 42,
  "participant_count": 18
}
```
- `approved_history: list[dict]` — son 4 onaylı mesajı tutar
- `seen_users: set[str]` — benzersiz katılımcıları tutar

#### `generate_display_texts()` — AI Metin Üretimi
Mesaj onaylandığında Claude Haiku (`claude-haiku-4-5-20251001`) otomatik olarak iki versiyon üretir:

| Alan | Amaç | Limit |
|---|---|---|
| `display_text` | Overlay ekranı için kısa özet | Maks. 80 karakter, tek satır |
| `presenter_text` | Sunucu için yazım düzeltilmiş tam metin | Maks. 500 karakter |

`ANTHROPIC_API_KEY` yoksa: `display_text` orijinal metnin ilk 80 karakteri, `presenter_text` orijinal metin olarak fallback yapılır.

#### `/approve` Endpoint Güncellemesi
Onay sırasında `generate_display_texts()` çağrılır, her onaylı item'a `display_text` ve `presenter_text` eklenir.

---

### 2. Overlay — Gerçek Veri Bağlantısı (`/overlay`)

**`frontend/src/pages/Overlay.jsx`** — polling hook eklendi:
- `useOverlayData()` hook'u ile `/overlay/data` her **3 saniyede** bir çekilir
- İlk yüklemede mock veri gösterilir, backend yanıt verince gerçek veriye geçilir
- Backend erişilemez olursa son geçerli veri korunur

**`frontend/src/components/live-flow/OverlayLive.jsx`** güncellemeleri:
- Inline QR SVG → `/assets/images/qr/join-qr.png` gerçek görseli
- `{idea.display_text || idea.text}` — AI kısa versiyonu varsa onu gösterir
- Sabit 247 / 89 rakamları → `totalIdeas` / `participantCount` gerçek prop'ları
- Boyutlar 3840×2160'dan **3200×1080**'e güncellendi (vMix lower third formatı)
- Logo boyutu: 400×180px

---

### 3. Admin Paneli — display_text / presenter_text Görünümü

**`frontend/src/pages/Admin.jsx`** — aktif mesaj önizlemesine iki yeni alan eklendi:
- **Overlay** etiketi → `display_text` (kırmızı sol çizgi, küçük font)
- **Sunucu** etiketi → `presenter_text` (kırmızı sol çizgi, küçük font)
- Orijinal metin soluk/küçük olarak üstte kalır

---

### 4. /presenter Sayfası — Sunucu Monitörü

**`app/presenter/page.jsx`** oluşturuldu.

- `/overlay/data` her **5 saniyede** bir çekilir
- Her onaylı mesaj için `presenter_text` büyük, okunabilir fontla gösterilir
- Kart yapısı: sıra numarası (kırmızı badge) + metin + kullanıcı adı + kaynak (YouTube/QR)
- Header: toplam fikir sayısı, katılımcı sayısı, son güncelleme saati
- Responsive font (`clamp`) — TV ve tablet mesafesinden okunacak şekilde optimize
- Koyu arka plan (`#080808`), yüksek kontrast, harici bağımlılık yok
- Boş durum: dönen loader + "Onaylanan mesaj bekleniyor…"

**Route:** `/presenter`

---

### 5. Web Sitesi Form Entegrasyonu

**`components/join-section.jsx`** güncellendi:
- `POST /submit` isteği: `{ user, text }` gönderir
- Başarı / hata durumu mesajları
- Ad/takma ad input alanı eklendi

**`app/join/page.jsx`** güncellemeleri:
- Logo boyutu büyütüldü (`h-16 w-auto`)
- Alt metin güncellendi: "En iyi fikir ekrana çıkar — seçilen fikir canlı yayında oylanır!"

---

### 6. Landing Page İçerik Güncellemeleri

- **Bölüm sırası:** Join (Fikrini Gönder) → How It Works sırasına alındı
- **Kanal sayısı:** "iki kanal" → "üç kanal" (QR + YouTube + Web sitesi)
- **Hero metni:** "hem de web sitesi üzerinden" eklendi
- **Flow Step 01:** "Çift Kanal Katılım" → "Üç Kanal Katılım"
- **Responsive heading:** Flow bölümü mobilde kırılmıyordu, düzeltildi

---

## Sistem Mimarisi (Mevcut Durum)

```
İzleyici
  ├── QR Kod → /join (Next.js) → POST /submit
  ├── YouTube Live Chat → YouTube API → ingest_youtube_message()
  └── Web Sitesi → /join (Next.js) → POST /submit
          │
          ▼
    FastAPI Backend (Railway)
          │
    Moderation Pipeline
    (Blacklist → Content Policy → AI Soft Filter)
          │
          ▼
    Admin Paneli (/admin)
    Operatör: Onayla / Reddet
          │
          ▼
    /approve → generate_display_texts() [Claude Haiku]
         ├── display_text (≤80 kar, overlay için)
         └── presenter_text (tam, düzeltilmiş)
          │
     ┌────┴──────┐
     ▼           ▼
/overlay      /presenter
(vMix)        (Sunucu monitörü)
3200×1080     /overlay/data her 5s
her 3s poll
```

---

## Aktif Servisler

| Servis | URL | Durum |
|---|---|---|
| Backend API | https://fikirarena-production.up.railway.app | Canlı |
| Landing Page | Vercel/Railway (Next.js) | Canlı |
| Overlay | http://localhost:5173/overlay | Local |
| Admin Panel | http://localhost:5173/admin | Local |
| Presenter | https://[domain]/presenter | Canlı (deploy sonrası) |

---

## Eksik / Yapılacaklar

### Kritik (Canlı Yayın Öncesi)
- [ ] `ANTHROPIC_API_KEY` Railway ortam değişkenine eklenmeli (AI şu an fallback modda)
- [ ] vMix entegrasyon testi — `/overlay` sayfasını browser input olarak ekle, şeffaflık doğrula
- [ ] Gerçek QR kodu `/assets/images/qr/join-qr.png` olarak frontend'e eklenmeli
- [ ] `interactive-live-system` için git repo kurulumu (şu an git yok, deploy manuel)

### Tasarım
- [ ] Figma mockup — logo + design system
- [ ] Overlay fade-in / fade-out animasyonları
- [ ] Presenter sayfası logo / marka kimliği

### Özellik
- [ ] Overlay istatistikleri (fikir/katılımcı) backend restart'ta sıfırlanıyor — kalıcı sayaç için basit dosya/DB çözümü
- [ ] `/presenter` sayfasına en son onaylanan tek mesajı büyük/vurgulu gösterme modu
- [ ] Admin panelinde `display_text` düzenlenebilir olsun (onay sonrası edit)

---

## Ortam Değişkenleri (Railway)

| Değişken | Durum | Not |
|---|---|---|
| `YOUTUBE_API_KEY` | Aktif | YouTube Data API v3 |
| `ANTHROPIC_API_KEY` | **Eksik** | Claude Haiku için gerekli |
| `STRICT_BLOCK_YELLOW` | Varsayılan `1` | Yellow policy otomatik bloklar |
