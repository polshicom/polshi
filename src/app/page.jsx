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

export default function Home() {
  return (
    <>
      <StatusBar />
      <Header />
      <ArbButton />
      <main>
        <Hero />
        <MarketDominance />
        <TopArbYesterday />
        <WhaleYesterday />
        <ScannerPreview />
        <SportsbookComingSoon />
      </main>
      <Footer />
    </>
  )
}
