import { Inter, Geist } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import '../styles/landing.css'
import '../styles/auth.css'
import '../styles/dashboard.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata = {
  title: 'Polshi – Compare Polymarket vs Kalshi prices',
  description:
    'See where Polymarket and Kalshi disagree on the same event. Find the biggest price differences and act before they close.',
  metadataBase: new URL('https://polshi.com'),
  openGraph: {
    title: 'Polshi – The Prediction Market Terminal',
    description: 'Find arbitrage between Polymarket and Kalshi. Track whale trades. Spot edges before they close.',
    siteName: 'Polshi',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Polshi – The Prediction Market Terminal',
    description: 'Find arbitrage between Polymarket and Kalshi. Track whale trades. Spot edges before they close.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('polshi-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}` }} />
      </head>
      <body className={inter.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
