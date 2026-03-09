'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

function parseVolume(volStr) {
  if (!volStr || typeof volStr !== 'string') return 0
  const cleaned = volStr.replace(/[$,]/g, '')
  if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1_000_000
  if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1_000
  return parseFloat(cleaned) || 0
}

function formatUsd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function ArbButton() {
  const [stats, setStats] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    fetch('/api/markets?confidence=all&limit=100')
      .then(r => r.json())
      .then(data => {
        const markets = data.markets || []
        const verified = markets.filter(m => m.verified && m.edge > 0)

        let totalProfit = 0
        for (const m of verified) {
          const vol = parseVolume(m.volume)
          totalProfit += (m.edge / 100) * vol
        }

        if (verified.length > 0) {
          setStats({ totalProfit, count: verified.length })
          setTimeout(() => setShow(true), 300)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <AnimatePresence>
      {show && stats && (
        <motion.a
          href="/arbitrage"
          className="arb-btn"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="arb-btn-dot" />
          <span className="arb-btn-label">
            {formatUsd(stats.totalProfit)} Top Arb of the Day
          </span>
          <span className="arb-btn-hover-label">View Scanner</span>
          <i className="arb-btn-chevron">
            <ChevronRight size={13} strokeWidth={2.5} />
          </i>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
