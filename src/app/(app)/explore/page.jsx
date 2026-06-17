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
          <h1 className="dashboard-title">Markets</h1>
          <p className="dashboard-subtitle">
            High-volume events across Polymarket and Kalshi, sorted by activity. Filter by category to find what you follow.
          </p>
        </div>
      </div>

      <MarketCards initialMarkets={[]} categories={[]} isPro={isPro} />
    </>
  )
}
