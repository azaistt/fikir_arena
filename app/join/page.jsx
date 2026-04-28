'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function JoinPage() {
  const [name, setName] = useState('')
  const [idea, setIdea] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !idea.trim()) return

    setStatus('loading')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), idea: idea.trim() }),
      })
      if (!res.ok) throw new Error('Sunucu hatası')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function handleReset() {
    setName('')
    setIdea('')
    setStatus('idle')
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Image
            src="/media/fikir-arena-logo-full.png"
            alt="Fikir Arena"
            width={180}
            height={48}
            priority
            className="h-10 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
          className="broadcast-frame panel-surface panel-glow border-l-[2px] border-l-[#ff1e1e] p-7 sm:p-10"
        >
          <AnimatePresence mode="wait">

            {/* Form state */}
            {status !== 'success' && (
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
                  En iyi fikir yayında okunur ve oylanır.
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
                      maxLength={280}
                      required
                      rows={4}
                      className="broadcast-card resize-none border border-[rgba(255,30,30,0.18)] bg-[rgba(255,255,255,0.03)] px-5 py-3.5 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#ff1e1e] focus:bg-[rgba(255,30,30,0.05)]"
                    />
                    <span className="self-end text-[0.65rem] text-[#555]">{idea.length}/280</span>
                  </div>

                  {status === 'error' && (
                    <p className="text-xs text-[#ff1e1e]">Bir hata oluştu, tekrar dene.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading' || !name.trim() || !idea.trim()}
                    className="broadcast-chip mt-1 min-h-13 bg-[linear-gradient(135deg,#ff1e1e,#b80e0e)] px-7 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(255,30,30,0.42)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {status === 'loading' ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Success state */}
            {status === 'success' && (
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
                  onClick={handleReset}
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
