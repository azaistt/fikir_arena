'use client'

import { motion } from 'framer-motion'
import HeroSection from './hero-section'
import FlowSection from './flow-section'
import LiveExperienceSection from './live-experience-section'
import JoinSection from './join-section'
import SiteFooter from './site-footer'

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.65, ease: 'easeOut' },
}

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      <header className="sticky top-0 z-50 border-b border-[rgba(255,30,30,0.16)] bg-[rgba(10,10,10,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-[#ff1e1e] shadow-[0_0_20px_rgba(255,30,30,0.8)]" />
            <div>
              <div className="label-ui text-[0.68rem] text-[#e6e6e6]">Broadcast Format</div>
              <div className="display-heading text-3xl leading-none tracking-[0.12em] text-[#e6e6e6]">
                Fikir <span className="text-[#ff1e1e]">Arena</span>
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-[#9a9a9a] md:flex">
            <a href="#flow" className="transition hover:text-white">
              Sistem Akışı
            </a>
            <a href="#experience" className="transition hover:text-white">
              Canlı Deneyim
            </a>
            <a href="#join" className="transition hover:text-white">
              Katılım
            </a>
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
        <HeroSection />

        <motion.div {...fadeIn}>
          <JoinSection />
        </motion.div>

        <motion.div {...fadeIn}>
          <FlowSection />
        </motion.div>

        <motion.div {...fadeIn}>
          <LiveExperienceSection />
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  )
}
