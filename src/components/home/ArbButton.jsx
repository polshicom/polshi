'use client'

import { useState, useEffect } from 'react'

export default function ArbButton() {
  const [arb, setArb] = useState(null)

  useEffect(() => {
    fetch('/api/top-arb')
      .then(r => r.json())
      .then(data => {
        if (data.topArb) setArb(data.topArb)
      })
      .catch(() => {})
  }, [])

  const profitLabel = arb ? `${arb.edge}¢ edge · $${Math.round(arb.edge * 10)}/1K` : null

  return (
    <a href="/arbitrage" className="arb-btn">
      <span className="arb-btn-dot" />
      <span className="arb-btn-label">
        Top Arb of the Day
        {profitLabel && <span className="arb-btn-stat">{profitLabel}</span>}
      </span>
      <span className="arb-btn-hover-label">Open Scanner</span>
      <svg className="arb-btn-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </a>
  )
}
