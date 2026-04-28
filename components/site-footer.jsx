import Image from 'next/image'

export default function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(255,30,30,0.16)] bg-[rgba(10,10,10,0.9)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-4">
          <Image
            src="/media/fikir-arena-logo.png"
            alt="Fikir Arena logo"
            width={110}
            height={72}
            className="h-auto w-24 drop-shadow-[0_0_12px_rgba(255,30,30,0.26)]"
          />
          <div>
            <div className="display-heading text-3xl leading-none tracking-[0.1em] text-[#e6e6e6]">
              Fikir <span className="text-[#ff1e1e]">Arena</span>
            </div>
            <div className="text-sm text-[#9a9a9a]">Powered by Interactive Live System</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm text-[#9a9a9a]">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
            Instagram
          </a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
            YouTube
          </a>
          <a href="https://x.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
            X
          </a>
        </div>
      </div>
    </footer>
  )
}
