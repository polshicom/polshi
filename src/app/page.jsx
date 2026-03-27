import Header from '../components/landing/Header'
import Hero from '../components/home/Hero'
import WhyPolshi from '../components/home/WhyPolshi'
import MarketDominance from '../components/home/MarketDominance'
import TopArbYesterday from '../components/home/TopArbYesterday'
import WhaleYesterday from '../components/home/WhaleYesterday'
import TopWhales from '../components/home/TopWhales'
import ArbPerformance from '../components/home/ArbPerformance'
import ScannerPreview from '../components/home/ScannerPreview'
import SportsbookComingSoon from '../components/home/SportsbookComingSoon'
import StatusBar from '../components/home/StatusBar'
import ArbButton from '../components/home/ArbButton'
import Footer from '../components/landing/Footer'
import { ShootingStars } from '../components/ui/shooting-stars'
import { Particles } from '../components/ui/particles'

export default function Home() {
  return (
    <>
      <StatusBar />
      <Header />
      <ArbButton />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Dark mode: multiple shooting stars with staggered timing */}
        <div className="dark-only" style={{ pointerEvents: 'none' }}>
          <ShootingStars starColor="#5e6ad2" trailColor="#10b981" minDelay={800} maxDelay={2500} />
          <ShootingStars starColor="#10b981" trailColor="#5e6ad2" minDelay={1200} maxDelay={3000} />
          <ShootingStars starColor="#3b82f6" trailColor="#8b5cf6" minDelay={1500} maxDelay={3500} />
        </div>
        {/* Light mode: gradient glows + subtle logo particles */}
        <div
          className="absolute inset-0 light-only"
          style={{
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 70% at 15% 40%, rgba(59,130,246,0.05) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 light-only"
          style={{
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 70% at 85% 40%, rgba(16,185,129,0.05) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <Particles
          className="absolute inset-0 light-only"
          quantity={100}
          ease={40}
          staticity={60}
          color="#000000"
          size={0.4}
          logos
          blur={0.8}
          excludeSelectors={[
            '.hero-simple-title',
            '.hero-simple-subtitle',
            '.hero-simple-actions',
            'header',
            'nav',
          ]}
        />
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Hero />
          <WhyPolshi />
          <MarketDominance />
          <TopArbYesterday />
          <WhaleYesterday />
          <TopWhales />
          <ArbPerformance />
          <ScannerPreview />
          <SportsbookComingSoon />
        </main>
      </div>
      <Footer />
    </>
  )
}
