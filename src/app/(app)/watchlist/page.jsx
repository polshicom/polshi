import { auth } from '../../../lib/auth'

export const metadata = {
  title: 'Watchlist – Polshi',
}

export default async function WatchlistPage() {
  const session = await auth()
  const isPro = session?.user?.isPro || false

  if (!isPro) {
    return (
      <div className="pro-gate">
        <span className="pro-gate-badge">Pro Feature</span>
        <h2>Custom Watchlists</h2>
        <p>
          Track specific markets and set alert thresholds.
          Upgrade to Pro to create your personalized watchlist.
        </p>
        <a href="/pricing" className="upgrade-btn">
          Upgrade to Pro
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Watchlist</h1>
          <p className="dashboard-subtitle">
            Markets you&apos;re tracking with custom alert thresholds
          </p>
        </div>
      </div>

      <WatchlistContent />
    </>
  )
}

async function WatchlistContent() {
  let items = []
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/watchlist`, { cache: 'no-store' })
    const data = await res.json()
    items = data.watchlist || []
  } catch {}

  if (items.length === 0) {
    return (
      <div className="dashboard-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
        <h2>No markets watched yet</h2>
        <p>Add markets from the Explore page to start tracking price differences and receive alerts.</p>
        <a href="/explore" className="upgrade-btn" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)' }}>
          Browse markets
        </a>
      </div>
    )
  }

  return (
    <div className="market-table-wrapper">
      <table className="market-table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Alert Threshold</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td><span className="market-question">{item.market_question}</span></td>
              <td>{item.alert_threshold}%</td>
              <td>
                <button className="settings-btn danger" style={{ fontSize: 12, height: 30, padding: '0 12px' }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
