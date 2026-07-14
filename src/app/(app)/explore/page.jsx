import { auth } from '../../../lib/auth'
import MarketCards from '../../../components/dashboard/MarketCards'

export const metadata = {
  title: 'Explore Markets – Polshi',
}

export default async function ExplorePage() {
  const session = await auth()
  const isPro = session?.user?.isPro || false

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">All Markets</h1>
          <p className="dashboard-subtitle">
            Every event on Kalshi and Polymarket, unified. Filter by category, sort by volume, and compare prices.
          </p>
        </div>
      </div>

      <MarketCards initialMarkets={[]} categories={[]} isPro={isPro} />
    </>
  )
}
