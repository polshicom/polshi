import { auth } from '../../../lib/auth'
import WhaleTable from '../../../components/dashboard/WhaleTable'

export const metadata = {
  title: 'Whale Tracking – Polshi',
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
            <h1 className="dashboard-title">Whale Trade Feed</h1>
            <p className="dashboard-subtitle">
              Large-size trades as they happen. See what high-conviction bettors are buying across both platforms.
            </p>
          </div>
        </div>
      </div>

      <WhaleTable isPro={isPro} />
    </>
  )
}
