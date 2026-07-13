'use client'

import { useState, useEffect } from 'react'

function confidenceLevel(aiConfidence) {
  if (aiConfidence >= 90) return 'high'
  if (aiConfidence >= 70) return 'medium'
  return 'low'
}

export default function ScannerPreview() {
  const [arbs, setArbs] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/markets?limit=3')
      .then(r => r.json())
      .then(data => {
        setArbs((data.markets || []).filter(m => m.edge > 0).slice(0, 3))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return (
      <section className="scanner-preview-section">
        <div className="scanner-preview-card">
          <h2 className="scanner-preview-heading">Live Scanner</h2>
          {[1, 2, 3].map(i => (
            <div key={i} className="scanner-preview-row scanner-preview-skeleton">
              <div className="best-opp-skeleton-line best-opp-skeleton-wide" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (arbs.length === 0) return null

  return (
    <section className="scanner-preview-section">
      <div className="scanner-preview-card">
        <h2 className="scanner-preview-heading">
          <span className="live-dot" />
          Live Scanner
        </h2>
        <div className="scanner-preview-list" style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
          {arbs.map((arb, i) => (
            <div key={i} className="scanner-preview-row">
              <span className="scanner-preview-rank">{i + 1}</span>
              <span className="scanner-preview-question">
                {arb.question.length > 45 ? arb.question.slice(0, 45) + '...' : arb.question}
              </span>
              <span className="scanner-preview-edge">{arb.edge}¢</span>
              {arb.aiConfidence != null && (
                <span className={`scanner-preview-confidence ${confidenceLevel(arb.aiConfidence)}`}>
                  {arb.aiConfidence}%
                </span>
              )}
            </div>
          ))}
        </div>
        <a href="/arbitrage" className="scanner-preview-cta-primary">
          Open Live Scanner
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
      </div>
    </section>
  )
}
