import { auth } from '../../../lib/auth'
import WhaleTable from '../../../components/dashboard/WhaleTable'

export const metadata = {
  title: 'Insider Tracker – Polshi',
}

export default async function WhalesPage() {
  const session = await auth()
  const isPro = session?.user?.isPro || false

  return (
    <>
      <div className="dashboard-header">
        <div>
          <div className="page-hero">
            <span className="live-badge">
              <span className="live-dot" />
              Live
            </span>
            <h1 className="dashboard-title">Insider Tracker</h1>
            <p className="dashboard-subtitle">
              Large trades ($5K+) across Polymarket and Kalshi — politics, economics, crypto, and more. Follow where informed money is moving.
            </p>
          </div>
        </div>
      </div>

      <WhaleTable isPro={isPro} />
    </>
  )
}
