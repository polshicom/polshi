'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import CompareChart from '../../../components/compare/CompareChart'
import CompareCard from '../../../components/compare/CompareCard'
import DominanceView from '../../../components/compare/DominanceView'

const TITLES = {
  dominance: 'Market Dominance',
}

const SUBTITLES = {
  dominance: 'Which platform is capturing more volume and liquidity right now',
}

function titleFromQuery(q) {
  if (!q) return 'Market Comparison'
  return q.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// Match arb pairs against query — split into words, require ALL to appear in question
function matchesQuery(question, query) {
  if (!question || !query) return false
  const q = question.toLowerCase()
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2)
  if (words.length === 0) return q.includes(query.toLowerCase())
  return words.every(w => q.includes(w))
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || ''
  const [pairs, setPairs] = useState([])
  const [soloMarkets, setSoloMarkets] = useState([])
  const [loading, setLoading] = useState(true)

  const isDominance = type === 'dominance'
  const title = isDominance ? TITLES.dominance : titleFromQuery(query)
  const subtitle = isDominance ? SUBTITLES.dominance : null

  useEffect(() => {
    if (isDominance) { setLoading(false); return }
    if (!query) { setLoading(false); return }

    async function load() {
      try {
        const [arbRes, exploreRes] = await Promise.all([
          fetch('/api/markets?confidence=all&limit=100').then(r => r.json()).catch(() => ({ markets: [] })),
          fetch(`/api/explore?q=${encodeURIComponent(query)}&limit=200`).then(r => r.json()).catch(() => ({ markets: [] })),
        ])

        const arbMarkets = arbRes.markets || []
        const exploreMarkets = exploreRes.markets || []

        // Better matching: use word-level matching instead of exact substring
        const matchedArbs = arbMarkets.filter(m => matchesQuery(m.question, query))

        const arbPairs = matchedArbs.map(m => ({
          question: m.question,
          polymarket: m.polymarket,
          kalshi: m.kalshi,
          spread: m.edge,
          category: m.category,
          polyUrl: m.polymarketUrl,
          kalshiUrl: m.kalshiUrl,
          endDate: m.endDate,
          polyVolume: null,
          kalshiVolume: null,
        }))

        const polyMarkets = exploreMarkets.filter(m => m.platform === 'polymarket')
        const kalshiMarkets = exploreMarkets.filter(m => m.platform === 'kalshi')

        // Enrich arb pairs with volume data
        for (const pair of arbPairs) {
          const pq = pair.question.toLowerCase().slice(0, 30)
          const pm = polyMarkets.find(m => m.question.toLowerCase().includes(pq))
          const km = kalshiMarkets.find(m => m.question.toLowerCase().includes(pq))
          if (pm) pair.polyVolume = pm.volume
          if (km) pair.kalshiVolume = km.volume
        }

        const arbQ = new Set(arbPairs.map(p => p.question.toLowerCase()))
        const solo = exploreMarkets.filter(m => !arbQ.has(m.question.toLowerCase()))

        setPairs(arbPairs)
        setSoloMarkets(solo)
      } catch {}
      setLoading(false)
    }
    load()
  }, [query, isDominance])

  return (
    <>
      <div className="dashboard-header">
        <div className="compare-header">
          <a href="/hub" className="compare-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Hub
          </a>
          <h1 className="dashboard-title">{title}</h1>
          <p className="dashboard-subtitle">
            {subtitle || (
              <>Comparing odds across Kalshi and Polymarket{pairs.length > 0 ? ` — ${pairs.length} matched market${pairs.length !== 1 ? 's' : ''}` : ''}</>
            )}
          </p>
        </div>
      </div>

      {isDominance ? (
        <DominanceView />
      ) : loading ? (
        <div className="compare-loading">Loading market data...</div>
      ) : pairs.length === 0 && soloMarkets.length === 0 ? (
        <div className="compare-empty">No markets found for &quot;{query}&quot;. Try a different search from the <a href="/hub">Hub</a>.</div>
      ) : (
        <>
          {pairs.length > 0 && <CompareChart pairs={pairs} />}

          {pairs.length > 0 && (
            <div className="compare-section">
              <h2 className="compare-section-title">Matched Markets</h2>
              <div className="compare-grid">{pairs.map((p, i) => <CompareCard key={i} pair={p} />)}</div>
            </div>
          )}

          {soloMarkets.length > 0 && (
            <div className="compare-section">
              <h2 className="compare-section-title">{pairs.length > 0 ? 'Single-Platform Markets' : 'Markets'}</h2>
              <div className="compare-solo-grid">
                {soloMarkets.slice(0, 20).map((m, i) => (
                  <a key={i} href={m.url || '#'} target="_blank" rel="noopener noreferrer" className="compare-solo-card">
                    <div className="compare-solo-top">
                      <span className={m.platform === 'polymarket' ? 'badge-polymarket' : 'badge-kalshi'}>{m.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}</span>
                      <span className="compare-solo-prob">{m.prob}%</span>
                    </div>
                    <div className="compare-solo-question">{m.question}</div>
                    <div className="compare-solo-vol">{m.volumeFormatted}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
