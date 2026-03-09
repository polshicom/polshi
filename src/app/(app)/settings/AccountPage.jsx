'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'

const PRO_FEATURES = [
  { label: 'Every arbitrage opportunity', included: { free: false, pro: true } },
  { label: '15-second live prices', included: { free: false, pro: true } },
  { label: 'Full access to 3,800+ markets', included: { free: false, pro: true } },
  { label: 'Whale trade feed', included: { free: false, pro: true } },
  { label: 'Watchlists with alerts', included: { free: false, pro: true } },
  { label: 'Discord notifications', included: { free: false, pro: true } },
  { label: 'CSV export', included: { free: false, pro: true } },
]

const FREE_FEATURES = [
  { label: '5 arbitrage opportunities', included: { free: true, pro: true } },
  { label: '15-minute delayed prices', included: { free: true, pro: false } },
  { label: 'AI-powered match verification', included: { free: true, pro: true } },
]

const ALL_FEATURES = [...FREE_FEATURES, ...PRO_FEATURES]

export default function AccountPage({ user, upgraded }) {
  const isPro = user?.isPro || false

  const [discordWebhook, setDiscordWebhook] = useState('')
  const [saved, setSaved] = useState(false)
  const [yearly, setYearly] = useState(false)
  const [cancelStep, setCancelStep] = useState(0)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (upgraded) {
      setShowBanner(true)
      const t = setTimeout(() => setShowBanner(false), 6000)
      return () => clearTimeout(t)
    }
  }, [upgraded])

  async function handleSaveWebhook() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleCheckout() {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: yearly ? 'yearly' : 'monthly' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  return (
    <>
      {showBanner && (
        <div className="account-success-banner">
          Welcome to Pro! You now have full access to all features.
        </div>
      )}

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Account</h1>
          <p className="dashboard-subtitle">Manage your plan and preferences</p>
        </div>
      </div>

      {/* Profile */}
      <div className="settings-section">
        <h2>Profile</h2>
        <div className="account-profile">
          <div className="account-avatar">
            {user?.image ? (
              <img src={user.image} alt={user.name || 'User'} />
            ) : (
              <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="account-profile-info">
            <div className="account-profile-name">{user?.name || '—'}</div>
            <div className="account-profile-email">{user?.email || '—'}</div>
          </div>
        </div>
      </div>

      {/* Your Plan */}
      <div className="settings-section">
        <h2>Your Plan</h2>
        <div className="account-plan-card">
          <div className="account-plan-header">
            <span className="account-plan-name">{isPro ? 'Pro' : 'Free'}</span>
            <span className={`account-plan-badge ${isPro ? 'pro' : ''}`}>
              {isPro ? 'Active' : 'Current plan'}
            </span>
          </div>
          <ul className="account-features">
            {ALL_FEATURES.map((f, i) => {
              const plan = isPro ? 'pro' : 'free'
              const included = f.included[plan]
              if (isPro && f.label === '15-minute delayed prices') return null
              return (
                <li key={i} className={included ? 'included' : 'excluded'}>
                  {f.label}
                </li>
              )
            })}
          </ul>
          {isPro && (
            <button className="settings-btn" onClick={handleManageBilling}>
              Manage billing
            </button>
          )}
        </div>
      </div>

      {/* Change Plan */}
      <div className="settings-section">
        <h2>{isPro ? 'Cancel Plan' : 'Upgrade'}</h2>
        {!isPro ? (
          <div className="account-change-section">
            <div className="account-toggle">
              <span
                className={`account-toggle-label ${!yearly ? 'active' : ''}`}
                onClick={() => setYearly(false)}
              >
                Monthly
              </span>
              <div
                className={`account-toggle-switch ${yearly ? 'active' : ''}`}
                onClick={() => setYearly(v => !v)}
              >
                <div className="account-toggle-knob" />
              </div>
              <span
                className={`account-toggle-label ${yearly ? 'active' : ''}`}
                onClick={() => setYearly(true)}
              >
                Yearly
              </span>
            </div>
            <div className="account-price">
              {yearly ? '$15' : '$19'}<span>/mo</span>
            </div>
            <div className="account-price-note">
              {yearly ? '$180/year — save $48' : '$19/month — billed monthly'}
            </div>
            <button className="account-upgrade-btn" onClick={handleCheckout}>
              Upgrade to Pro
            </button>
          </div>
        ) : (
          <div className="account-change-section">
            {cancelStep === 0 ? (
              <button
                className="settings-btn danger"
                onClick={() => setCancelStep(1)}
              >
                Cancel membership
              </button>
            ) : (
              <div className="account-cancel-warning">
                <p>
                  You'll lose access to Pro features at the end of your current billing period.
                  This includes unlimited markets, live prices, whale feed, watchlists, and Discord alerts.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="settings-btn danger" onClick={handleManageBilling}>
                    Confirm cancellation
                  </button>
                  <button className="settings-btn" onClick={() => setCancelStep(0)}>
                    Keep Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Discord Alerts (Pro only) */}
      {isPro && (
        <div className="settings-section">
          <h2>Discord Alerts</h2>
          <div className="settings-row">
            <span className="settings-row-label">Webhook URL</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="url"
                className="settings-input"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
              />
              <button className="settings-btn" onClick={handleSaveWebhook}>
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <div className="settings-section">
        <h2>Session</h2>
        <div className="settings-row">
          <span className="settings-row-label">Sign out of your account</span>
          <button className="settings-btn danger" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
