'use client'

import { useState, useEffect } from 'react'

export default function TopArbs() {
  const [arbs, setArbs] = useState([])

  useEffect(() => {
    fetch('/api/markets?confidence=all&limit=10')
      .then(r => r.json())
      .then(data => {
        const markets = data.markets || []
        const safe = markets.filter(m => (m.isArbSafe || m.verified) && m.edge > 0)
        setArbs(safe.slice(0, 5))
      })
      .catch(() => {})
  }, [])

  if (arbs.length === 0) return null

  return (
    <section className="top-arbs-section">
      <div className="top-arbs">
        <h2 className="top-arbs-heading">Top Arb of the Day</h2>

        <div className="top-arbs-list">
          {arbs.map((arb, i) => (
            <a key={i} href="/arbitrage" className="top-arbs-row">
              <span className="top-arbs-rank">{i + 1}</span>
              <span className="top-arbs-question">
                {arb.question.length > 55 ? arb.question.slice(0, 55) + '...' : arb.question}
              </span>
              <span className="top-arbs-edge">{arb.edge}¢ edge</span>
              <span className="top-arbs-profit">${Math.round(arb.edge * 10)}/1K</span>
            </a>
          ))}
        </div>

        <p className="top-arbs-trust">
          Scanning 500+ markets across Polymarket & Kalshi every 15 seconds
        </p>
      </div>
    </section>
  )
}
