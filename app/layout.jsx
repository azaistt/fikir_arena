import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sora',
})

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-rajdhani',
})

export const metadata = {
  title: 'Fikir Arena | Interactive Live Format',
  description:
    'Fikir Arena için TV, YouTube ve web katılımını birleştiren premium yayın formatı landing page.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} ${bebas.variable}`}>{children}</body>
    </html>
  )
}
