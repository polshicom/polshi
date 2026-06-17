import Header from '../components/landing/Header'
import Hero from '../components/home/Hero'
import ProofStrip from '../components/home/ProofStrip'
import TopArbYesterday from '../components/home/TopArbYesterday'
import ArbPerformance from '../components/home/ArbPerformance'
import WhaleYesterday from '../components/home/WhaleYesterday'
import ScannerPreview from '../components/home/ScannerPreview'
import WhyPolshi from '../components/home/WhyPolshi'
import PricingCTA from '../components/home/PricingCTA'
import StatusBar from '../components/home/StatusBar'
import Footer from '../components/landing/Footer'

export default function Home() {
  return (
    <div className="homepage">
      <StatusBar />
      <Header />
      <main>
        <Hero />
        <ProofStrip />
        <TopArbYesterday />
        <ArbPerformance />
        <WhaleYesterday />
        <ScannerPreview />
        <WhyPolshi />
        <PricingCTA />
      </main>
      <Footer />
    </div>
  )
}
