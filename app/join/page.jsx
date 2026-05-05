'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fikirarena-production.up.railway.app'
const MAX_IDEA_LENGTH = 280
const POLL_MS = 3000

function usePollState() {
  const [poll, setPoll] = useState(null)
  const wsRef = useRef(null)
  const timerRef = useRef(null)

  const fetchPoll = async () => {
    try {
      const res = await fetch(`${API}/poll`)
      if (res.ok) setPoll(await res.json())
    } catch {}
  }

  useEffect(() => {
    fetchPoll()
    timerRef.current = setInterval(fetchPoll, POLL_MS)

    const wsUrl = API.replace(/^https?/, (m) => (m === 'https' ? 'wss' : 'ws')) + '/ws'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'poll_update') setPoll(data.poll)
      } catch {}
    }
    ws.onclose = () => {}

    return () => {
      clearInterval(timerRef.current)
      ws.close()
    }
  }, [])

  const ideas = poll?.ideas || []
  const phase = !poll
    ? 'idle'
    : poll.active
    ? 'voting'
    : poll.total_votes > 0
    ? 'ended'
    : 'idle'

  const winner =
    phase === 'ended' && ideas.length > 0
      ? ideas.reduce((a, b) => (b.votes > a.votes ? b : a))
      : null

  return { phase, ideas, winner }
}

export default function JoinPage() {
  const [name, setName] = useState('')
  const [idea, setIdea] = useState('')
  const [formStatus, setFormStatus] = useState('idle')
  const [selectedId, setSelectedId] = useState(null)
  const [voteStatus, setVoteStatus] = useState('')
  const { phase, ideas, winner } = usePollState()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !idea.trim()) return
    setFormStatus('loading')
    try {
      const res = await fetch(`${API}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), text: idea.trim() }),
      })
      if (!res.ok) throw new Error()
      setFormStatus('success')
    } catch {
      setFormStatus('error')
    }
  }

  async function handleVote(ideaId) {
    if (selectedId) return
    setSelectedId(ideaId)
    const voterId = (() => {
      let id = localStorage.getItem('fk_voter_id')
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('fk_voter_id', id) }
      return id
    })()
    try {
      const res = await fetch(`${API}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea_id: ideaId, voter_id: voterId }),
      })
      const data = await res.json()
      if (data.status === 'ok') setVoteStatus('Oyun alındı.')
      else if (data.detail?.includes('already')) setVoteStatus('Zaten oy kullandın.')
      else setVoteStatus('Oylama kapandı.')
    } catch {
      setVoteStatus('Bir hata oluştu.')
    }
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="mb-10 flex justify-center">
          <Image
            src="/media/fikir-arena-logo-full.png"
            alt="Fikir Arena"
            width={260}
            height={70}
            priority
            className="h-16 w-auto object-contain"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
          className="broadcast-frame panel-surface panel-glow border-l-[2px] border-l-[#ff1e1e] p-7 sm:p-10"
        >
          <AnimatePresence mode="wait">

            {/* OYLAMA AŞAMASI */}
            {phase === 'voting' && ideas.length > 0 && (
              <motion.div
                key="voting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <p className="label-ui text-[0.7rem] text-[#9a9a9a]">Canlı Oylama</p>
                <h1 className="display-heading mt-3 text-[2.4rem] leading-[0.92] text-[#f3f3f3] sm:text-[3rem]">
                  Final Fikrini Seç
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#9a9a9a]">
                  En beğendiğin fikre tıkla veya YouTube sohbetine{' '}
                  <strong className="text-white">1, 2 veya 3</strong> yaz.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                  {ideas.slice(0, 3).map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleVote(item.id)}
                      disabled={!!selectedId}
                      className={`broadcast-card flex items-center gap-4 border px-5 py-4 text-left transition
                        ${selectedId === item.id
                          ? 'border-[#ff1e1e] bg-[rgba(255,30,30,0.08)] text-white'
                          : 'border-[rgba(255,30,30,0.18)] bg-[rgba(255,255,255,0.03)] text-[#e6e6e6] hover:border-[rgba(255,30,30,0.45)] hover:bg-[rgba(255,30,30,0.05)]'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[#ff1e1e] font-bold text-white broadcast-chip text-sm">
                        {index + 1}
                      </span>
                      <strong className="font-medium">{item.text}</strong>
                    </button>
                  ))}
                </div>

                {voteStatus && (
                  <p className="mt-4 text-center text-sm text-[#9a9a9a]">{voteStatus}</p>
                )}

                <p className="mt-5 text-center text-[0.68rem] text-[#555]">
                  YouTube sohbetine <strong className="text-[#888]">1, 2 veya 3</strong> yazarak da oy kullanabilirsin
                </p>
              </motion.div>
            )}

            {/* OYLAMA BİTTİ */}
            {phase === 'ended' && winner && (
              <motion.div
                key="ended"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="broadcast-chip mb-6 flex h-16 w-16 items-center justify-center bg-[linear-gradient(135deg,#ff1e1e,#b80e0e)] text-3xl shadow-[0_0_28px_rgba(255,30,30,0.38)]">
                  🏆
                </div>
                <p className="label-ui text-[0.7rem] text-[#9a9a9a]">Oylama Tamamlandı</p>
                <h2 className="display-heading mt-3 text-[2.8rem] leading-[0.92] text-[#f3f3f3]">
                  Kazanan Fikir
                </h2>
                <p className="mt-5 text-base font-medium leading-6 text-white">{winner.text}</p>
              </motion.div>
            )}

            {/* FİKİR GÖNDERME FORMU */}
            {phase === 'idle' && formStatus !== 'success' && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <p className="label-ui text-[0.7rem] text-[#9a9a9a]">Yayına Katıl</p>
                <h1 className="display-heading mt-3 text-[2.6rem] leading-[0.92] text-[#f3f3f3] sm:text-[3.4rem]">
                  Fikrini Gönder
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#9a9a9a]">
                  En iyi fikir ekrana çıkar — seçilen fikir canlı yayında oylanır!
                </p>

                <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="label-ui text-[0.65rem] text-[#9a9a9a]">İsim</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Adın veya takma adın"
                      maxLength={48}
                      required
                      className="broadcast-card min-h-12 border border-[rgba(255,30,30,0.18)] bg-[rgba(255,255,255,0.03)] px-5 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#ff1e1e] focus:bg-[rgba(255,30,30,0.05)]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="label-ui text-[0.65rem] text-[#9a9a9a]">Fikir</label>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="Fikrin nedir?"
                      maxLength={MAX_IDEA_LENGTH}
                      required
                      rows={4}
                      className="broadcast-card resize-none border border-[rgba(255,30,30,0.18)] bg-[rgba(255,255,255,0.03)] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#ff1e1e] focus:bg-[rgba(255,30,30,0.05)]"
                    />
                    <span className="self-end text-[0.65rem] text-[#555]">{idea.length}/{MAX_IDEA_LENGTH}</span>
                  </div>

                  {formStatus === 'error' && (
                    <p className="text-xs text-[#ff1e1e]">Bir hata oluştu, tekrar dene.</p>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === 'loading' || !name.trim() || !idea.trim()}
                    className="broadcast-chip mt-1 min-h-13 bg-[linear-gradient(135deg,#ff1e1e,#b80e0e)] px-7 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(255,30,30,0.42)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {formStatus === 'loading' ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* BAŞARILI */}
            {phase === 'idle' && formStatus === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="broadcast-chip mb-6 flex h-16 w-16 items-center justify-center bg-[linear-gradient(135deg,#ff1e1e,#b80e0e)] text-3xl shadow-[0_0_28px_rgba(255,30,30,0.38)]">
                  ✓
                </div>
                <p className="label-ui text-[0.7rem] text-[#9a9a9a]">Başarılı</p>
                <h2 className="display-heading mt-3 text-[2.8rem] leading-[0.92] text-[#f3f3f3]">
                  Fikrin Alındı!
                </h2>
                <p className="mt-4 max-w-xs text-sm leading-6 text-[#9a9a9a]">
                  Fikrin operatör paneline iletildi. Yayını takip et!
                </p>
                <button
                  onClick={() => setFormStatus('idle')}
                  className="broadcast-card mt-8 border border-[rgba(255,30,30,0.22)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e6e6e6] transition hover:border-[#ff1e1e] hover:text-white"
                >
                  Yeni Fikir Gönder
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <p className="mt-6 text-center text-[0.68rem] text-[#555]">
          fikirarenasi.xyz
        </p>
      </div>
    </main>
  )
}
