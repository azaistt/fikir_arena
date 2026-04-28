'use client'

import { motion } from 'framer-motion'

export default function JoinSection() {
  return (
    <section id="join" className="broadcast-frame panel-surface panel-glow border-l-[2px] border-l-[#ff1e1e] px-5 py-8 sm:px-8 sm:py-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="label-ui text-[0.74rem] text-[#e6e6e6]">Join The Show</p>
          <h2 className="display-heading mt-4 text-[3rem] leading-[0.9] tracking-[0.06em] text-[#e6e6e6] sm:text-[4.5rem]">
            Fikrini Gönder. Yayında Yerini Al.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#e6e6e6] sm:text-lg">
            Katılım iki kanaldan akar: TV ekranındaki QR kod hızlı mobil giriş üretir,
            YouTube canlı sohbet ise yayına anlık ikinci bir akış kazandırır.
          </p>

          <form className="mt-8 flex flex-col gap-4 sm:flex-row" onSubmit={(event) => event.preventDefault()}>
            <input
              type="text"
              placeholder="Fikrini buraya yaz..."
              className="broadcast-card min-h-14 flex-1 border border-[rgba(255,30,30,0.18)] bg-[rgba(255,255,255,0.03)] px-6 text-white outline-none transition placeholder:text-[#9a9a9a] focus:border-[#ff1e1e] focus:bg-[rgba(255,30,30,0.06)]"
            />
            <button
              type="submit"
              className="broadcast-chip min-h-14 bg-[linear-gradient(135deg,#ff1e1e,#b80e0e)] px-7 font-[var(--font-sora)] text-base font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(255,30,30,0.42)]"
            >
              Gönder
            </button>
          </form>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="broadcast-card border border-[rgba(255,30,30,0.14)] bg-[linear-gradient(180deg,rgba(15,15,15,0.92),rgba(10,10,10,0.84))] p-5">
            <div className="label-ui text-[0.68rem] text-[#9a9a9a]">QR Entry</div>
            <div className="broadcast-card mt-4 border border-[rgba(255,30,30,0.16)] bg-[linear-gradient(135deg,rgba(255,30,30,0.12),rgba(184,14,14,0.08))] p-4">
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 25 }).map((_, index) => (
                  <div
                    key={index}
                    className={`aspect-square ${
                      index % 2 === 0 || index % 3 === 0 ? 'bg-white' : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="broadcast-card border border-[rgba(255,30,30,0.14)] bg-[rgba(255,255,255,0.03)] p-5">
            <div className="label-ui text-[0.68rem] text-[#9a9a9a]">YouTube Chat Layer</div>
            <div className="mt-4 space-y-3">
              {['Canlı sohbetten katılım', 'Anlık ikinci giriş akışı', 'Yayına hazır veri'].map((item) => (
                <div key={item} className="broadcast-card border border-[rgba(255,30,30,0.12)] bg-[rgba(10,10,10,0.78)] px-4 py-3 text-sm text-[#e6e6e6]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
