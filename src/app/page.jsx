import Header from '../components/landing/Header'
import Hero from '../components/home/Hero'
import MarketDominance from '../components/home/MarketDominance'
import TopArbYesterday from '../components/home/TopArbYesterday'
import WhaleYesterday from '../components/home/WhaleYesterday'
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
        {/* Dark mode: shooting stars on black */}
        <div className="dark-only">
          <ShootingStars
            starColor="#5e6ad2"
            trailColor="#10b981"
            minDelay={2000}
            maxDelay={5000}
          />
        </div>
        {/* Light mode: particles on white */}
        <Particles
          className="absolute inset-0 light-only"
          quantity={80}
          ease={80}
          color="#000000"
          size={0.4}
        />
        <main>
          <Hero />
          <MarketDominance />
          <TopArbYesterday />
          <WhaleYesterday />
          <ScannerPreview />
          <SportsbookComingSoon />
        </main>
      </div>
      <Footer />
    </>
  )
}
