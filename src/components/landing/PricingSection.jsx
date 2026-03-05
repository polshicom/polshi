'use client'

import { useState } from 'react'

export default function PricingSection() {
  const [yearly, setYearly] = useState(false)

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

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-header">
        <div className="pricing-label">
          <span className="pricing-dot"></span>
          Pricing
        </div>
        <h2 className="pricing-heading">One arb pays for the month</h2>
        <p className="pricing-subtitle">
          Free tier gets you started. Pro unlocks the full scanner, live whale feeds, and every market on both platforms.
        </p>
      </div>

      <div className="pricing-toggle">
        <span
          className={`pricing-toggle-label ${!yearly ? 'active' : ''}`}
          onClick={() => setYearly(false)}
        >
          Monthly
        </span>
        <div
          className={`pricing-toggle-switch ${yearly ? 'active' : ''}`}
          onClick={() => setYearly(v => !v)}
        >
          <div className="pricing-toggle-knob"></div>
        </div>
        <span
          className={`pricing-toggle-label ${yearly ? 'active' : ''}`}
          onClick={() => setYearly(true)}
        >
          Yearly
        </span>
        <span className="pricing-save-badge">Save $48</span>
      </div>

      <div className="pricing-grid">
        <div className="pricing-card">
          <div className="pricing-card-name">Free</div>
          <div className="pricing-card-price">$0<span>/mo</span></div>
          <div className="pricing-card-note">No credit card needed</div>
          <a href="/signup" className="pricing-card-btn secondary">Start free</a>
          <ul className="pricing-features">
            <li>5 arbitrage opportunities</li>
            <li>15-minute delayed prices</li>
            <li>AI-powered match verification</li>
            <li>Community match voting</li>
          </ul>
        </div>

        <div className="pricing-card featured">
          <div className="pricing-card-name">Pro</div>
          <div className="pricing-card-price">
            {yearly ? '$15' : '$19'}<span>/mo</span>
          </div>
          <div className="pricing-card-note">
            {yearly ? '$180/year · save $48' : '$19/month · billed monthly'}
          </div>
          <button className="pricing-card-btn primary" onClick={handleCheckout}>
            Go Pro
          </button>
          <ul className="pricing-features">
            <li>Every arbitrage opportunity</li>
            <li>15-second live prices</li>
            <li>Full access to 3,800+ markets</li>
            <li>Whale trade feed</li>
            <li>Watchlists with alerts</li>
            <li>Discord notifications</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
