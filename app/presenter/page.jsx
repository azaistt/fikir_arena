'use client'

import { useEffect, useRef, useState } from 'react'

const API = 'https://fikirarena-production.up.railway.app'
const POLL_MS = 5000

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
