import { auth } from '../../../lib/auth'
import { getPlan } from '../../../lib/plans'
import MarketTable from '../../../components/dashboard/MarketTable'

export const metadata = {
  title: 'Arbitrage Scanner – Polshi',
}

export default async function ArbitragePage() {
  const session = await auth()
  const plan = getPlan(session?.user?.plan || 'free')
  const isPro = session?.user?.isPro || false

  let markets = []
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/markets?confidence=all&limit=100`, {
      cache: 'no-store',
    })
    const data = await res.json()
    markets = data.markets || []
  } catch {
    // Markets will be empty, client can retry
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <div className="page-hero">
            <span className="live-badge">
              <span className="live-dot" />
              Live Scanner Active
            </span>
            <h1 className="dashboard-title">Live Arbitrage Scanner</h1>
            <p className="dashboard-subtitle">
              Scanning Kalshi and Polymarket for pricing gaps in real time. Profit estimates, fee breakdowns, and edge calculations built in.
            </p>
          </div>
        </div>
      </div>

      <MarketTable
        initialMarkets={markets}
        isPro={isPro}
        refreshInterval={plan.refreshInterval}
      />
    </>
  )
}
