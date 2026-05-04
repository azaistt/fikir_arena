'use client'

import { useEffect, useRef, useState } from 'react'

const API = 'https://fikirarena-production.up.railway.app'
const POLL_MS = 5000
const DECISION_POLL_MS = 3000

const STATE_LABELS = {
  top3: 'İLK 3 BELLİ OLDU',
  poll: 'İZLEYİCİ OYLAMASI',
  result: 'FİNAL SONUCU',
}

const STATE_COLORS = {
  top3: '#1a6fff',
  poll: '#ff9900',
  result: '#ff1e1e',
}

function useLiveData() {
  const [messages, setMessages] = useState([])
  const [totalIdeas, setTotalIdeas] = useState(0)
  const [participantCount, setParticipantCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const fetchData = async () => {
    try {
      const res = await fetch(`${API}/overlay/data`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.messages)) setMessages(data.messages)
      if (typeof data.total_ideas === 'number') setTotalIdeas(data.total_ideas)
      if (typeof data.participant_count === 'number') setParticipantCount(data.participant_count)
      setLastUpdated(new Date())
    } catch {
      // backend erişilemez — son veriler korunur
    }
  }

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [])

  return { messages, totalIdeas, participantCount, lastUpdated }
}

function useDecisionState() {
  const [decision, setDecision] = useState({ state: 'top3', top3Ideas: [], updated_at: null })
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API}/decision-state`)
        if (res.ok) setDecision(await res.json())
      } catch {}
    }
    fetch_()
    const t = setInterval(fetch_, DECISION_POLL_MS)
    return () => clearInterval(t)
  }, [])
  return decision
}

function buildAiComment(idea) {
  const { reason, scores } = idea
  if (!scores) return null
  const { originality, feasibility, broadcast_value } = scores
  const avg = Math.round((originality + feasibility + broadcast_value) / 3)
  const strengthWord = avg >= 80 ? 'güçlü' : avg >= 65 ? 'dengeli' : 'gelişime açık'
  const parts = []
  if (reason) parts.push(`Yapay zeka bu fikri "${reason}" olarak öne çıkardı.`)
  parts.push(
    `Özgünlük %${originality}, uygulanabilirlik %${feasibility}, yayın değeri %${broadcast_value} — genel olarak ${strengthWord} bir profil.`
  )
  return parts.join(' ')
}

function DecisionPanel({ decision }) {
  const { state, top3Ideas, updated_at } = decision
  const color = STATE_COLORS[state] || '#888'
  const label = STATE_LABELS[state] || state
  const timeStr = updated_at
    ? new Date(updated_at * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <section
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color}44`,
        borderLeft: `4px solid ${color}`,
        borderRadius: '0 12px 12px 0',
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Başlık satırı */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontFamily: 'var(--font-rajdhani)', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color }} >
            {label}
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#555', letterSpacing: '0.08em' }}>
          KARAR EKRANI · {timeStr}
        </span>
      </div>

      {/* Fikir listesi */}
      {top3Ideas.length === 0 ? (
        <p style={{ margin: 0, color: '#444', fontSize: '0.9rem' }}>Henüz fikir seçilmedi.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {top3Ideas.map((idea, i) => {
            const aiComment = buildAiComment(idea)
            return (
              <div key={idea.id ?? i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color + '22', border: `1px solid ${color}66`, borderRadius: 6, fontFamily: 'var(--font-rajdhani)', fontSize: '1rem', fontWeight: 700, color, lineHeight: 1 }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Uzun metin — sunucu okur */}
                  <p style={{ margin: 0, fontSize: '1rem', color: '#e8e8e8', lineHeight: 1.4, fontFamily: 'var(--font-sora)', wordBreak: 'break-word' }}>
                    {idea.presenter_text || idea.text}
                  </p>
                  {/* Kısa overlay metni */}
                  {idea.text && idea.presenter_text && idea.text !== idea.presenter_text && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#555', lineHeight: 1.4, fontFamily: 'var(--font-sora)', wordBreak: 'break-word' }}>
                      <span style={{ color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.65rem', marginRight: 6 }}>Overlay:</span>
                      {idea.text}
                    </p>
                  )}
                  {(idea.reason || idea.name) && (
                    <div style={{ marginTop: 6, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {idea.reason && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: color + '18', border: `1px solid ${color}44`, borderRadius: 4, color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {idea.reason}
                        </span>
                      )}
                      {idea.name && (
                        <span style={{ fontSize: '0.72rem', color: '#666' }}>{idea.name}</span>
                      )}
                    </div>
                  )}
                  {aiComment && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#888', lineHeight: 1.5, fontFamily: 'var(--font-sora)', fontStyle: 'italic', borderLeft: `2px solid ${color}33`, paddingLeft: '0.6rem' }}>
                      {aiComment}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function SourceBadge({ source }) {
  const isYT = source === 'YouTube'
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 14px',
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderRadius: 4,
        background: isYT ? 'rgba(255,0,0,0.18)' : 'rgba(255,255,255,0.10)',
        color: isYT ? '#ff4444' : '#aaaaaa',
        border: `1px solid ${isYT ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,255,0.15)'}`,
      }}
    >
      {isYT ? 'YouTube' : 'QR'}
    </span>
  )
}

function MessageCard({ item, index }) {
  const text = item.presenter_text || item.text
  return (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'flex-start',
        padding: '2rem 2.5rem',
        background: 'rgba(255,255,255,0.04)',
        borderLeft: '5px solid #ff1e1e',
        borderRadius: '0 12px 12px 0',
      }}
    >
      {/* Sıra numarası */}
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ff1e1e',
          borderRadius: 8,
          fontFamily: 'var(--font-rajdhani)',
          fontSize: '1.75rem',
          color: '#fff',
          lineHeight: 1,
        }}
      >
        {index + 1}
      </div>

      {/* Metin + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#f3f3f3',
            fontFamily: 'var(--font-sora)',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </p>
        <div
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.9rem',
              color: '#777',
              fontFamily: 'var(--font-sora)',
            }}
          >
            {item.user}
          </span>
          <SourceBadge source={item.source} />
        </div>
      </div>
    </div>
  )
}

export default function PresenterPage() {
  const { messages, totalIdeas, participantCount, lastUpdated } = useLiveData()
  const decision = useDecisionState()

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#f3f3f3',
        fontFamily: 'var(--font-sora)',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {/* Başlık */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 6,
              height: 36,
              background: '#ff1e1e',
              borderRadius: 3,
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#ff1e1e',
                fontWeight: 700,
              }}
            >
              Fikir Arena
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-rajdhani)',
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                letterSpacing: '0.06em',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              SUNUCU PANELİ
            </h1>
          </div>
        </div>

        {/* İstatistikler */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-rajdhani)', color: '#fff', lineHeight: 1 }}>
              {totalIdeas}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#777', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Fikir
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-rajdhani)', color: '#fff', lineHeight: 1 }}>
              {participantCount}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#777', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Katılımcı
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '1rem', color: '#555', lineHeight: 1.8 }}>
              {timeStr}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Güncellendi
            </p>
          </div>
        </div>
      </header>

      {/* Karar ekranı durumu */}
      <DecisionPanel decision={decision} />

      {/* Mesaj listesi */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              opacity: 0.35,
              paddingTop: '6rem',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid #555',
                borderTopColor: '#ff1e1e',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#888' }}>
              Onaylanan mesaj bekleniyor…
            </p>
          </div>
        ) : (
          messages.map((item, index) => (
            <MessageCard key={item.id ?? index} item={item} index={index} />
          ))
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
