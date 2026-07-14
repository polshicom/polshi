'use client'

export default function UpgradeOverlay({ count }) {
  async function handleUpgrade() {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'monthly' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  return (
    <div className="upgrade-overlay">
      <div className="upgrade-card">
        <h3>You're seeing the free preview</h3>
        <p>
          {count} more market{count !== 1 ? 's' : ''} behind the paywall.
          Go Pro for the full scanner, live prices, and whale alerts.
        </p>
        <button className="upgrade-btn" onClick={handleUpgrade}>
          Go Pro — $19/mo
        </button>
      </div>
    </div>
  )
}
