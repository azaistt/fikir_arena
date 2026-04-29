'use client'

import { motion } from 'framer-motion'
import { flowSteps } from '../lib/site-content'

export default function FlowSection() {
  return (
    <section id="flow" className="broadcast-frame panel-surface panel-glow border-l-[2px] border-l-[#ff1e1e] px-5 py-8 sm:px-8 sm:py-10">
      <div className="w-full max-w-3xl">
        <p className="label-ui text-[0.74rem] text-[#e6e6e6]">How It Works</p>
        <h2 className="display-heading mt-4 text-[2rem] leading-[0.92] tracking-[0.06em] text-[#e6e6e6] sm:text-[3rem] lg:text-[4.5rem]">
          İzleyici → Etkileşim → Sistem → Yayın
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#e6e6e6] sm:text-lg">
          TV + YouTube + Web formatın en güçlü omurgasıdır: izleyici TV üzerindeki QR kodla,
          YouTube sohbetten ya da web sitesi üzerinden yayına girer, sistem toplar ve filtreler,
          yayın seçer, anket kararı büyütür.
        </p>
      </div>

      <div className="relative mt-10">
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-[linear-gradient(90deg,rgba(255,30,30,0.08),rgba(255,30,30,0.7),rgba(184,14,14,0.24),rgba(255,30,30,0.08))] lg:block" />
        <div className="grid gap-4 lg:grid-cols-6">
          {flowSteps.map((step, index) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="broadcast-card relative border border-[rgba(255,30,30,0.16)] bg-[rgba(255,255,255,0.03)] p-5"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="label-ui text-[0.74rem] text-[#ff1e1e]">{step.index}</span>
                <span className="hidden h-3 w-3 rounded-full bg-[#ff1e1e] shadow-[0_0_14px_rgba(255,30,30,0.9)] lg:block" />
              </div>
              <h3 className="display-heading text-[2rem] leading-none tracking-[0.06em] text-[#e6e6e6]">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-[#e6e6e6]">{step.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
