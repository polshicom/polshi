import { auth } from '../../../lib/auth'
import MarketCards from '../../../components/dashboard/MarketCards'

export const metadata = {
  title: 'Explore Markets – Polshi',
}

export default async function ExplorePage() {
  const session = await auth()
  const isPro = session?.user?.isPro || false

  const limit = isPro ? 1000 : 300

  let markets = []
  let categories = []
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/explore?limit=${limit}`, {
      cache: 'no-store',
    })
    const data = await res.json()
    markets = data.markets || []
    categories = data.meta?.categories || []
  } catch {
    // Markets will be empty, client can retry
  }

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

      <MarketCards initialMarkets={markets} categories={categories} isPro={isPro} />
    </>
  )
}
