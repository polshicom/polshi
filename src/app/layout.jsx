import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import '../styles/landing.css'
import '../styles/auth.css'
import '../styles/dashboard.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
  title: 'Polshi – Compare Polymarket vs Kalshi prices',
  description:
    'See where Polymarket and Kalshi disagree on the same event. Find the biggest price differences and act before they close.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body className={inter.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
