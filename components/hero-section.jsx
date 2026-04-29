'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const heroChips = ['LIVE SYSTEM', 'REAL-TIME', 'INTERACTIVE', 'AUDIENCE-DRIVEN']

export default function HeroSection() {
  return (
    <section className="grid min-h-[calc(100vh-96px)] items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl"
      >
        <div className="label-ui mb-5 inline-flex flex-wrap items-center gap-3 text-[0.74rem] text-[#e6e6e6]">
          <span className="broadcast-chip inline-flex items-center gap-2 border border-[rgba(255,30,30,0.22)] bg-[rgba(255,30,30,0.12)] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-[#ff1e1e] [animation:pulse-dot_1.2s_ease-in-out_infinite]" />
            Broadcast Format
          </span>
          <span className="text-[#e6e6e6]">TV + YouTube + Web</span>
        </div>

        <h1 className="display-heading max-w-[10ch] text-[4.2rem] leading-[0.88] tracking-[0.04em] text-[#e6e6e6] sm:text-[5.5rem] lg:text-[7rem]">
          Yayını İzleme. Yayının Parçası Ol.
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-8 text-[#e6e6e6] sm:text-xl">
          İzleyici artık sadece izleyen değil, karar veren. Fikir Arena&apos;da katılım hem
          TV ekranındaki QR kod üzerinden, hem YouTube canlı sohbet akışı hem de web sitesi üzerinden aynı anda büyür.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#join"
            className="broadcast-chip inline-flex min-h-14 items-center justify-center bg-[linear-gradient(135deg,#ff1e1e,#b80e0e)] px-7 font-[var(--font-sora)] text-base font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(255,30,30,0.42)]"
          >
            Yayına Katıl
          </a>
          <a
            href="#flow"
            className="broadcast-chip inline-flex min-h-14 items-center justify-center border border-[rgba(255,30,30,0.22)] bg-[rgba(255,255,255,0.03)] px-7 font-[var(--font-sora)] text-base font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[#ff1e1e] hover:bg-[rgba(255,30,30,0.08)]"
          >
            Formatı Keşfet
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {heroChips.map((chip) => (
            <span
              key={chip}
              className="broadcast-chip label-ui border border-[rgba(255,30,30,0.16)] bg-[rgba(10,10,10,0.78)] px-4 py-2 text-[0.7rem] text-[#9a9a9a]"
            >
              {chip}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        className="broadcast-frame panel-glow panel-surface shine-mask relative overflow-hidden border-l-[2px] border-l-[#ff1e1e] p-5 sm:p-6"
      >
        <div className="absolute inset-x-6 top-5 flex items-center justify-between text-[0.72rem] text-[#9a9a9a]">
          <span className="label-ui text-[#e6e6e6]">Live Control Layer</span>
          <span className="broadcast-chip inline-flex items-center gap-2 border border-[rgba(255,30,30,0.22)] bg-[rgba(255,30,30,0.12)] px-3 py-1 text-[#e6e6e6]">
            <span className="h-2 w-2 rounded-full bg-[#ff1e1e] [animation:pulse-dot_1s_ease-in-out_infinite]" />
            LIVE
          </span>
        </div>

        <div className="grid gap-4 pt-12">
          <div className="broadcast-card border border-[rgba(255,30,30,0.16)] bg-[linear-gradient(180deg,rgba(15,15,15,0.94),rgba(10,10,10,0.9))] p-5">
            <div className="flex flex-col gap-6">
              <div className="broadcast-divider">
                <p className="label-ui text-[0.72rem] text-[#9a9a9a]">Format Identity</p>
                <h2 className="display-heading mt-2 text-5xl leading-none tracking-[0.08em] text-[#e6e6e6]">
                  Fikir <span className="text-[#ff1e1e]">Arena</span>
                </h2>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[#e6e6e6]">
                  TV QR katılımı ve YouTube sohbet akışı tek format içinde birleşir.
                </p>
              </div>

              <div className="broadcast-card relative overflow-hidden border border-[rgba(255,30,30,0.16)] bg-[radial-gradient(circle_at_center,rgba(255,30,30,0.1),transparent_65%),linear-gradient(180deg,rgba(19,19,19,0.92),rgba(8,8,8,0.96))] px-4 py-5">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.06)_48%,transparent_72%)] opacity-70" />
                <Image
                  src="/media/fikir-arena-logo-full.png"
                  alt="Fikir Arena tam logo"
                  width={900}
                  height={540}
                  className="relative mx-auto h-auto w-full max-w-[560px] object-contain drop-shadow-[0_0_28px_rgba(255,30,30,0.22)]"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
            <div className="broadcast-card border border-[rgba(255,30,30,0.16)] bg-[rgba(255,255,255,0.02)] p-4">
              <p className="label-ui text-[0.68rem] text-[#9a9a9a]">Incoming Stream</p>
              <div className="mt-4 space-y-3">
                {['QR ile fikir geldi', 'YouTube sohbet akışı işlendi', 'Top 3 belirlendi', 'Anket aktif'].map((line, index) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0.35, x: -8 }}
                    animate={{ opacity: [0.35, 1, 0.55], x: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.2, delay: index * 0.45 }}
                    className="broadcast-card flex items-center gap-3 border border-[rgba(255,30,30,0.12)] bg-[rgba(10,10,10,0.78)] px-4 py-3 text-sm text-[#e6e6e6]"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff1e1e] shadow-[0_0_12px_rgba(255,30,30,0.95)]" />
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="broadcast-card border border-[rgba(255,30,30,0.16)] bg-[rgba(255,255,255,0.02)] p-4">
              <p className="label-ui text-[0.68rem] text-[#9a9a9a]">Audience Pulse</p>
              <div className="mt-4 space-y-4">
                {[76, 58, 92].map((value, index) => (
                  <div key={value}>
                    <div className="mb-2 flex items-center justify-between text-sm text-[#e6e6e6]">
                      <span>Vote Layer {index + 1}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1.2, delay: 0.3 + index * 0.18, ease: 'easeOut' }}
                        className="h-full bg-[linear-gradient(90deg,#b80e0e,#ff1e1e)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
