'use client'

import { useState } from 'react'

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 4.5L6.5 11.5L2.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LOCK = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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
    <div className="pp">
      <div className="pp-hero">
        <div className="pp-badge">Pricing</div>
        <h1 className="pp-title">One arb pays for the month</h1>
        <p className="pp-subtitle">
          Start free, upgrade when you're ready. Pro unlocks the full scanner, live prices, and whale feeds across every market.
        </p>

        <div className="pp-toggle">
          <div className="pp-toggle-track" data-active={yearly ? 'right' : 'left'}>
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
            </button>
            <div className="pp-toggle-slider" />
          </div>
          {yearly && <span className="pp-save-pill">Save 21%</span>}
        </div>
      </div>

      <div className="pp-grid">
        {/* Free */}
        <div className="pp-card">
          <div className="pp-card-head">
            <span className="pp-plan-label">Free</span>
            <div className="pp-price-row">
              <span className="pp-price-dollar">$</span>
              <span className="pp-price-num">0</span>
            </div>
            <p className="pp-plan-tagline">No credit card required</p>
          </div>
          <div className="pp-card-body">
            <ul className="pp-features">
              <Feature>5 arbitrage opportunities</Feature>
              <Feature>15-minute delayed prices</Feature>
              <Feature>AI match verification</Feature>
              <Feature>Community match voting</Feature>
            </ul>
          </div>
          <div className="pp-card-foot">
            <a href="/signup" className="pp-cta pp-cta-ghost">
              Get started {ARROW}
            </a>
          </div>
        </div>

        {/* Pro */}
        <div className="pp-card pp-card-pro">
          <div className="pp-glow" />
          <div className="pp-card-head">
            <div className="pp-pro-label-row">
              <span className="pp-plan-label">Pro</span>
              <span className="pp-popular">Most popular</span>
            </div>
            <div className="pp-price-row">
              <span className="pp-price-dollar">$</span>
              <span className="pp-price-num">{yearly ? 15 : 19}</span>
              <span className="pp-price-unit">/mo</span>
            </div>
            <p className="pp-plan-tagline">
              {yearly ? 'Billed $180/year' : 'Billed monthly'}
            </p>
          </div>
          <div className="pp-card-body">
            <ul className="pp-features">
              <Feature pro>Every arbitrage opportunity</Feature>
              <Feature pro>15-second live prices</Feature>
              <Feature pro>3,800+ markets scanned</Feature>
              <Feature pro>Whale trade feed</Feature>
              <Feature pro>Watchlists with alerts</Feature>
              <Feature pro>Discord notifications</Feature>
            </ul>
          </div>
          <div className="pp-card-foot">
            <button
              className="pp-cta pp-cta-primary"
              onClick={() => handleCheckout(yearly ? 'yearly' : 'monthly')}
            >
              Go Pro {ARROW}
            </button>
          </div>
        </div>

        {/* Sports */}
        <div className="pp-card pp-card-dim">
          <div className="pp-card-head">
            <div className="pp-pro-label-row">
              <span className="pp-plan-label">Sports</span>
              <span className="pp-soon">{LOCK} Coming soon</span>
            </div>
            <div className="pp-price-row">
              <span className="pp-price-dollar">$</span>
              <span className="pp-price-num">{yearly ? 25 : 30}</span>
              <span className="pp-price-unit">/mo</span>
            </div>
            <p className="pp-plan-tagline">
              {yearly ? 'Billed $300/year' : 'Everything in Pro, plus sportsbooks'}
            </p>
          </div>
          <div className="pp-card-body">
            <ul className="pp-features">
              <Feature>Everything in Pro</Feature>
              <Feature>FanDuel sportsbook arbs</Feature>
              <Feature>DraftKings integration</Feature>
              <Feature>BetMGM integration</Feature>
              <Feature>Caesars integration</Feature>
              <Feature>Dedicated sports scanner</Feature>
            </ul>
          </div>
          <div className="pp-card-foot">
            <button className="pp-cta pp-cta-ghost" disabled>
              Notify me {ARROW}
            </button>
          </div>
        </div>
      </div>

      <div className="pp-trust-strip">
        <TrustItem icon="shield">Secure checkout via Stripe</TrustItem>
        <TrustItem icon="x">Cancel anytime, no questions</TrustItem>
        <TrustItem icon="zap">Upgrade or downgrade instantly</TrustItem>
      </div>

      <div className="pp-faq-section">
        <h2 className="pp-faq-heading">Questions &amp; answers</h2>
        <div className="pp-faq-grid">
          <FAQ q="What is prediction market arbitrage?" a="Prediction markets let you buy YES or NO shares priced $0–$1. When the same event is priced differently on Polymarket and Kalshi, buying YES on one and NO on the other for under $1 total locks in a guaranteed profit." />
          <FAQ q="How does Polshi find arbs?" a="We scan both platforms every 30 seconds, match equivalent markets with AI-powered text analysis, and calculate the price spread. When we find a mismatch, we show you exactly where to buy on each platform." />
          <FAQ q="How fast are the prices?" a="Pro gets 15-second updates from each platform's API. Free refreshes every 15 minutes." />
          <FAQ q="What is whale tracking?" a="We monitor large trades in real time and score each by size relative to normal activity. Repeat whales are flagged so you can follow smart money." />
          <FAQ q="Is this financial advice?" a="No. Polshi displays publicly available price data. Nothing on this site is financial, investment, or trading advice." />
          <FAQ q="How do I cancel?" a="Account settings → cancel. Your access continues through the end of your billing period." />
        </div>
      </div>
    </div>
  )
}

function Feature({ children, pro }) {
  return (
    <li className={pro ? 'pro' : ''}>
      <span className="pp-check">{CHECK}</span>
      {children}
    </li>
  )
}

function TrustItem({ children, icon }) {
  const icons = {
    shield: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2.5 4v4c0 3.5 2.5 5.5 5.5 6.5 3-1 5.5-3 5.5-6.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
    x: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" /><path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
    zap: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8.5 1.5L3.5 9h4l-1 5.5 6-8h-4.5l.5-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  }
  return (
    <div className="pp-trust-item">
      <span className="pp-trust-icon">{icons[icon]}</span>
      {children}
    </div>
  )
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`pp-faq-item ${open ? 'open' : ''}`}>
      <button className="pp-faq-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg className="pp-faq-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="pp-faq-a">
        <p>{a}</p>
      </div>
    </div>
  )
}
