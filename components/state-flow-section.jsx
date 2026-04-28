'use client'

import { motion } from 'framer-motion'
import { states } from '../lib/site-content'

export default function StateFlowSection() {
  return (
    <section className="panel-surface panel-glow rounded-[32px] px-5 py-8 sm:px-8 sm:py-10">
      <div className="max-w-3xl">
        <p className="label-ui text-[0.74rem] text-sky-200">State-Based Flow</p>
        <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.04em] text-white sm:text-5xl">
          Standby’den sonuca giden yayın sistemi.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Her evre farklı bir ritim yaratır. Sistem bir web sayfası gibi değil, çalışan bir
          operasyon katmanı gibi hissedilir.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        {states.map((state, index) => (
          <motion.div
            key={state.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.4, delay: index * 0.07 }}
            className={`min-w-[170px] flex-1 rounded-[26px] border border-white/10 bg-gradient-to-br ${state.tone} p-[1px]`}
          >
            <div className="rounded-[25px] bg-[rgba(6,10,22,0.9)] px-5 py-5">
              <div className="label-ui text-[0.68rem] text-slate-400">State {index + 1}</div>
              <div className="mt-3 text-xl font-semibold text-white">{state.name}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
