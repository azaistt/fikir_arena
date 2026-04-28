'use client'

import { motion } from 'framer-motion'
import { liveMessages, pollResults } from '../lib/site-content'

export default function LiveExperienceSection() {
  return (
    <section id="experience" className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="broadcast-frame panel-surface panel-glow border-l-[2px] border-l-[#ff1e1e] px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-ui text-[0.74rem] text-[#e6e6e6]">Real Experience</p>
            <h2 className="display-heading mt-4 text-[2.8rem] leading-[0.9] tracking-[0.06em] text-[#e6e6e6] sm:text-[4rem]">
              Canlı Yayın Hissi Burada Başlar.
            </h2>
          </div>
          <div className="broadcast-chip border border-[rgba(255,30,30,0.22)] bg-[rgba(255,30,30,0.12)] px-3 py-1 text-sm text-[#e6e6e6]">
            LIVE
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {liveMessages.map((message) => (
            <motion.div
              key={message.name}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: message.delay }}
              className="broadcast-card border border-[rgba(255,30,30,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="h-8 w-8 bg-[linear-gradient(135deg,#b80e0e,#ff1e1e)]" />
                <div>
                  <div className="label-ui text-[0.62rem] text-[#9a9a9a]">Incoming Comment</div>
                  <div className="font-[var(--font-sora)] text-lg font-semibold tracking-[0.08em] text-[#e6e6e6]">
                    {message.name}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-6 text-[#e6e6e6]">{message.text}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="broadcast-frame panel-surface panel-glow relative overflow-hidden border-l-[2px] border-l-[#ff1e1e] px-5 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,30,30,0.18),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent)] [animation:scan-line_6s_linear_infinite]" />

        <p className="label-ui text-[0.74rem] text-[#e6e6e6]">Poll + Result Layer</p>
        <h2 className="display-heading mt-4 text-[2.8rem] leading-[0.9] tracking-[0.06em] text-[#e6e6e6] sm:text-[4rem]">
          Oylama Yükselir, Sonuç Görünür Hale Gelir.
        </h2>

        <div className="broadcast-card mt-8 border border-[rgba(255,30,30,0.14)] bg-[rgba(10,10,10,0.84)] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="label-ui text-[0.62rem] text-[#9a9a9a]">Audience Vote</div>
              <div className="mt-1 font-[var(--font-sora)] text-lg font-semibold text-[#e6e6e6]">
                Top 3 Final Poll
              </div>
            </div>
            <div className="broadcast-chip border border-[rgba(255,30,30,0.22)] bg-[rgba(255,30,30,0.12)] px-3 py-1 text-sm text-[#e6e6e6]">
              Real-Time Update
            </div>
          </div>

          <div className="space-y-5">
            {pollResults.map((result, index) => (
              <div key={result.label}>
                <div className="mb-2 flex items-center justify-between text-sm text-[#e6e6e6]">
                  <span>{result.label}</span>
                  <span>{result.value}%</span>
                </div>
                <div className="h-3 overflow-hidden bg-white/8">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${result.value}%` }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 1.1, delay: 0.2 + index * 0.1, ease: 'easeOut' }}
                    className="h-full bg-[linear-gradient(90deg,#b80e0e,#ff1e1e)]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ['Feasibility', '78'],
              ['Market', '65'],
              ['Risk', '40'],
            ].map(([title, value]) => (
              <div key={title} className="broadcast-card border border-[rgba(255,30,30,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-center">
                <div className="label-ui text-[0.62rem] text-[#9a9a9a]">{title}</div>
                <div className="mt-2 font-[var(--font-sora)] text-3xl font-semibold text-[#e6e6e6]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
