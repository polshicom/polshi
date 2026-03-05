'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const [discordWebhook, setDiscordWebhook] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSaveWebhook() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Settings</h1>
          <p className="dashboard-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="settings-section">
        <h2>Account</h2>
        <div className="settings-row">
          <span className="settings-row-label">Name</span>
          <span className="settings-row-value">{user?.name || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Email</span>
          <span className="settings-row-value">{user?.email || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Plan</span>
          <span className="settings-row-value" style={user?.isPro ? { color: 'var(--color-brand-bg)' } : undefined}>
            {user?.isPro ? 'Pro' : 'Free'}
          </span>
        </div>
      </div>

      {user?.isPro && (
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

      <div className="settings-section">
        <h2>Subscription</h2>
        {user?.isPro ? (
          <div className="settings-row">
            <span className="settings-row-label">Manage your subscription, payment method, or cancel</span>
            <button className="settings-btn" onClick={handleManageBilling}>
              Manage billing
            </button>
          </div>
        ) : (
          <div className="settings-row">
            <span className="settings-row-label">Upgrade to Pro for unlimited markets and real-time data</span>
            <a href="/pricing" className="upgrade-btn" style={{ fontSize: 13, height: 36, padding: '0 16px', textDecoration: 'none' }}>
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>

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
