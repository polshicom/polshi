'use client'

import { useState, useEffect } from 'react'

function confidenceLabel(aiConfidence) {
  if (aiConfidence >= 90) return { label: 'HIGH', cls: 'hp-badge-high' }
  if (aiConfidence >= 70) return { label: 'MED', cls: 'hp-badge-med' }
  return { label: 'LOW', cls: 'hp-badge-low' }
}

export default function ScannerPreview() {
  const [arbs, setArbs] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/markets?limit=5')
      .then(r => r.json())
      .then(data => {
        setArbs((data.markets || []).filter(m => m.edge > 0).slice(0, 5))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return (
      <section className="hp-scanner-section">
        <div className="hp-section-wrap">
          <div className="hp-scanner-card hp-scanner-loading">
            {[1, 2, 3].map(i => (
              <div key={i} className="hp-scanner-row-skeleton" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (arbs.length === 0) return null

  const visible = arbs.slice(0, 3)
  const blurred = arbs.slice(3)

  return (
    <section className="hp-scanner-section">
      <div className="hp-section-wrap">
        <div className="hp-section-label">
          <span className="hp-live-dot-sm" />
          Live Scanner
        </div>

        <div className="hp-scanner-card">
          <div className="hp-scanner-thead">
            <span className="hp-scanner-col-event">Event</span>
            <span className="hp-scanner-col-gap">Price Gap</span>
            <span className="hp-scanner-col-profit">Profit / $1k</span>
            <span className="hp-scanner-col-conf">Confidence</span>
          </div>

          {visible.map((arb, i) => {
            const profitPer1K = Math.round(arb.edge * 10)
            const conf = arb.aiConfidence != null ? confidenceLabel(arb.aiConfidence) : null
            return (
              <div key={i} className="hp-scanner-row">
                <span className="hp-scanner-col-event hp-scanner-question">
                  {arb.question.length > 55 ? arb.question.slice(0, 55) + '…' : arb.question}
                </span>
                <span className="hp-scanner-col-gap hp-scanner-gap">{arb.edge}¢</span>
                <span className="hp-scanner-col-profit hp-scanner-profit">+${profitPer1K}</span>
                <span className="hp-scanner-col-conf">
                  {conf && <span className={`hp-badge ${conf.cls}`}>{conf.label}</span>}
                </span>
              </div>
            )
          })}

          {blurred.length > 0 && (
            <div className="hp-scanner-blur-wrap">
              {blurred.map((arb, i) => {
                const profitPer1K = Math.round(arb.edge * 10)
                return (
                  <div key={i} className="hp-scanner-row hp-scanner-row-blurred">
                    <span className="hp-scanner-col-event hp-scanner-question">
                      {arb.question.length > 55 ? arb.question.slice(0, 55) + '…' : arb.question}
                    </span>
                    <span className="hp-scanner-col-gap hp-scanner-gap">{arb.edge}¢</span>
                    <span className="hp-scanner-col-profit hp-scanner-profit">+${profitPer1K}</span>
                    <span className="hp-scanner-col-conf" />
                  </div>
                )
              })}
              <div className="hp-scanner-lock">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>See all open price gaps</span>
                <a href="/arbitrage" className="hp-cta-primary hp-scanner-open">
                  Open Full Scanner
                </a>
              </div>
            </div>
          )}

          {blurred.length === 0 && (
            <div className="hp-scanner-cta-row">
              <a href="/arbitrage" className="hp-cta-primary">Open Full Scanner</a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
