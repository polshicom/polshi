import Header from '../components/landing/Header'
import SearchHero from '../components/home/SearchHero'
import BestOpportunity from '../components/home/BestOpportunity'
import TopArbs from '../components/home/TopArbs'
import TrendingMarkets from '../components/home/TrendingMarkets'
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
        <SearchHero />
        <BestOpportunity />
        <TopArbs />
        <TrendingMarkets />
      </main>
      <Footer />
    </>
  )
}
