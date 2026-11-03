import { auth } from '../../../lib/auth'
import MarketCards from '../../../components/dashboard/MarketCards'

export const metadata = {
  title: 'Matched Markets – Polshi',
}

export default async function ExplorePage() {
  const session = await auth()
  const isPro = session?.user?.isPro || false

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Matched Markets</h1>
          <p className="dashboard-subtitle">
            Events matched across Kalshi and Polymarket. Compare prices, spot spreads, and find arbitrage opportunities.
          </p>
        </div>
      </div>

      <MarketCards initialMarkets={[]} categories={[]} isPro={isPro} />
    </>
  )
}
