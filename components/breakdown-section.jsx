'use client'

import { motion } from 'framer-motion'
import { breakdownCards } from '../lib/site-content'
import MockVisual from './mock-visual'

export default function BreakdownSection() {
  return (
    <section id="breakdown" className="panel-surface panel-glow rounded-[32px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="max-w-3xl">
        <p className="label-ui text-[0.74rem] text-violet-200">Live Format Breakdown</p>
        <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.04em] text-white sm:text-5xl">
          Formatın her katmanı ekranda çalışan bir canlı sistem gibi görünür.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {breakdownCards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="mb-5 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,14,28,0.96),rgba(5,9,20,0.8))] p-4">
              <MockVisual type={card.mock} />
            </div>
            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{card.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
