'use client'

import { useState } from 'react'

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  async function handleCheckout(plan) {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  return (
    <>
      <div className="pp-header">
        <h1 className="pp-title">One arb pays for the month</h1>
        <p className="pp-subtitle">
          Free tier gets you started. Pro unlocks the full scanner, live whale feeds, and every market on both platforms.
        </p>
        <div className="pp-toggle">
          <button
            className={`pp-toggle-btn ${!yearly ? 'active' : ''}`}
            onClick={() => setYearly(false)}
          >
            Monthly
          </button>
          <button
            className={`pp-toggle-btn ${yearly ? 'active' : ''}`}
            onClick={() => setYearly(true)}
          >
            Yearly
            <span className="pp-save-tag">Save 21%</span>
          </button>
        </div>
      </div>

      <div className="pp-grid">
        {/* Free */}
        <div className="pp-card">
          <div className="pp-card-top">
            <span className="pp-plan-name">Free</span>
            <p className="pp-plan-desc">Get started — no credit card needed</p>
            <div className="pp-price">
              <span className="pp-price-amount">$0</span>
            </div>
          </div>
          <ul className="pp-features">
            <li>5 arbitrage opportunities</li>
            <li>15-minute delayed prices</li>
            <li>AI-powered match verification</li>
            <li>Community match voting</li>
          </ul>
          <a href="/signup" className="pp-btn pp-btn-secondary">Start free</a>
        </div>

        {/* Pro */}
        <div className="pp-card pp-card-featured">
          <div className="pp-popular-badge">Most Popular</div>
          <div className="pp-card-top">
            <span className="pp-plan-name">Pro</span>
            <p className="pp-plan-desc">Full scanner + live whale feeds</p>
            <div className="pp-price">
              <span className="pp-price-amount">${yearly ? 15 : 19}</span>
              <span className="pp-price-period">/month</span>
            </div>
            {yearly && (
              <span className="pp-billed-note">$180/year — save $48</span>
            )}
          </div>
          <ul className="pp-features pp-features-pro">
            <li>Every arbitrage opportunity</li>
            <li>15-second live prices</li>
            <li>Full access to 3,800+ markets</li>
            <li>Whale trade feed</li>
            <li>Watchlists with alerts</li>
            <li>Discord notifications</li>
          </ul>
          <button className="pp-btn pp-btn-primary" onClick={() => handleCheckout(yearly ? 'yearly' : 'monthly')}>
            Go Pro
          </button>
        </div>

        {/* Sports */}
        <div className="pp-card pp-card-muted">
          <div className="pp-card-top">
            <div className="pp-name-row">
              <span className="pp-plan-name">Sports</span>
              <span className="pp-coming-badge">Coming Soon</span>
            </div>
            <p className="pp-plan-desc">Sportsbook arbitrage + everything in Pro</p>
            <div className="pp-price">
              <span className="pp-price-amount">${yearly ? 25 : 30}</span>
              <span className="pp-price-period">/month</span>
            </div>
            {yearly && (
              <span className="pp-billed-note">$300/year — save $60</span>
            )}
          </div>
          <ul className="pp-features">
            <li>Everything in Pro</li>
            <li>FanDuel sportsbook arbs</li>
            <li>DraftKings integration</li>
            <li>BetMGM integration</li>
            <li>Caesars Sportsbook integration</li>
            <li>Sports arb scanner</li>
          </ul>
          <button className="pp-btn pp-btn-secondary" disabled>Coming Soon</button>
        </div>
      </div>

      <div className="pp-trust">
        <span>Cancel anytime</span>
        <span className="pp-trust-dot" />
        <span>No hidden fees</span>
        <span className="pp-trust-dot" />
        <span>Secure checkout via Stripe</span>
      </div>

      <div className="pp-faq">
        <h2 className="pp-faq-title">Frequently asked questions</h2>
        <FAQ q="What is prediction market arbitrage?" a="Prediction markets let you buy YES or NO shares on an outcome, priced between $0 and $1. When the same event is on both Polymarket and Kalshi at different prices, you can buy YES on one and NO on the other. If your total cost is under $1.00, you're guaranteed a profit — one of your positions always pays out $1." />
        <FAQ q="How does Polshi find arbitrage?" a="We scan Polymarket and Kalshi in real time, match equivalent markets using AI-powered text analysis, and calculate the price spread. When we find a mismatch, we show you exactly where to buy on each platform." />
        <FAQ q="How often are prices updated?" a="Pro subscribers get 15-second updates sourced directly from each platform's API. Free tier data refreshes every 15 minutes." />
        <FAQ q="What is whale tracking?" a="Whale tracking monitors large trades across both platforms in real time. Each trade gets a whale score based on its size relative to typical activity. Repeat whales are flagged so you can follow smart money." />
        <FAQ q="Is this financial advice?" a="No. Polshi is an informational tool that displays publicly available price data. Nothing on this site constitutes financial, investment, or trading advice." />
        <FAQ q="How do I cancel?" a="You can cancel anytime from your account settings. Your Pro access continues until the end of your current billing period." />
      </div>
    </>
  )
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`pp-faq-item ${open ? 'open' : ''}`}>
      <button className="pp-faq-q" onClick={() => setOpen(!open)}>
        {q}
        <span className="pp-faq-icon">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="pp-faq-a">{a}</p>}
    </div>
  )
}
