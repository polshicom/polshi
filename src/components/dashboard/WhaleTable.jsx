'use client'

import { useState, useEffect, useCallback } from 'react'

const CATEGORIES = [
  { value: 'all',             label: 'All' },
  { value: 'US Politics',     label: 'US Politics' },
  { value: 'World Politics',  label: 'World' },
  { value: 'Economics',       label: 'Economics' },
  { value: 'Crypto',          label: 'Crypto' },
  { value: 'Tech & AI',       label: 'Tech & AI' },
  { value: 'Sports',          label: 'Sports' },
  { value: 'Business',        label: 'Business' },
  { value: 'Science & Space', label: 'Science' },
  { value: 'Other',           label: 'Other' },
]

const SIZE_OPTIONS = [
  { value: '5000',   label: '$5K+' },
  { value: '10000',  label: '$10K+' },
  { value: '25000',  label: '$25K+' },
  { value: '50000',  label: '$50K+' },
  { value: '100000', label: '$100K+' },
]

function sizeTier(dollarValue) {
  if (dollarValue >= 500_000) return { label: 'Mega',    cls: 'wt-tier-mega'    }
  if (dollarValue >= 100_000) return { label: 'Block',   cls: 'wt-tier-whale'   }
  if (dollarValue >= 25_000)  return { label: 'Large',   cls: 'wt-tier-large'   }
  return                              { label: 'Notable', cls: 'wt-tier-notable' }
}

function timeAgo(isoStr) {
  const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const DEMO_TRADES = [
  { time: new Date(Date.now() - 14_000).toISOString(),  platform: 'polymarket', market: 'Will the Federal Reserve cut rates at the June 2026 meeting?',  side: 'YES', dollarValue: 85000,  dollarFormatted: '$85K',  category: 'Economics'      },
  { time: new Date(Date.now() - 38_000).toISOString(),  platform: 'kalshi',    market: 'Will Ukraine sign a ceasefire agreement before July 2026?',       side: 'NO',  dollarValue: 52000,  dollarFormatted: '$52K',  category: 'World Politics' },
  { time: new Date(Date.now() - 72_000).toISOString(),  platform: 'polymarket', market: 'Bitcoin above $150K before July 2026',                            side: 'YES', dollarValue: 31000,  dollarFormatted: '$31K',  category: 'Crypto'         },
  { time: new Date(Date.now() - 95_000).toISOString(),  platform: 'kalshi',    market: 'Will Trump sign a new tariff package before Q3 2026?',             side: 'YES', dollarValue: 120000, dollarFormatted: '$120K', category: 'US Politics'    },
  { time: new Date(Date.now() - 160_000).toISOString(), platform: 'polymarket', market: 'Will OpenAI release GPT-5 before June 2026?',                      side: 'YES', dollarValue: 18000,  dollarFormatted: '$18K',  category: 'Tech & AI'      },
  { time: new Date(Date.now() - 210_000).toISOString(), platform: 'kalshi',    market: 'US GDP growth above 2% in Q2 2026',                                side: 'NO',  dollarValue: 67000,  dollarFormatted: '$67K',  category: 'Economics'      },
]

export default function WhaleTable({ isPro }) {
  const [trades, setTrades] = useState([])
  const [platform, setPlatform] = useState('all')
  const [minSize, setMinSize] = useState('5000')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(tick)
  }, [])

  const fetchTrades = useCallback(async (showLoading = false) => {
    if (!isPro) return
    if (showLoading) setLoading(true)
    try {
      const params = new URLSearchParams({ platform, minSize, category })
      const res = await fetch(`/api/whales?${params}`)
      const data = await res.json()
      if (data.trades) {
        setTrades(data.trades)
        setCountdown(60)
      }
    } catch {}
    setLoading(false)
  }, [platform, minSize, category, isPro])

  useEffect(() => {
    if (isPro) { fetchTrades(true) } else { setLoading(false) }
  }, [fetchTrades, isPro])

  useEffect(() => {
    if (!isPro) return
    const iv = setInterval(() => fetchTrades(false), 60_000)
    return () => clearInterval(iv)
  }, [fetchTrades, isPro])

  useEffect(() => {
    if (!isPro) return
    const tick = setInterval(() => setCountdown(p => p <= 1 ? 60 : p - 1), 1000)
    return () => clearInterval(tick)
  }, [isPro])

  const displayTrades = isPro ? trades : DEMO_TRADES
  const FREE_VISIBLE = 3
  const visibleTrades = isPro ? displayTrades : displayTrades.slice(0, FREE_VISIBLE)
  const blurredTrades = isPro ? [] : displayTrades.slice(FREE_VISIBLE)

  return (
    <>
      {/* Category filter tabs */}
      <div className="it-category-bar">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`it-cat-btn ${category === c.value ? 'it-cat-btn-active' : ''}`}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="wt-filter-bar">
        <div className="wt-platform-tabs">
          {['all', 'polymarket', 'kalshi'].map(p => (
            <button
              key={p}
              className={`wt-tab ${platform === p ? 'wt-tab-active' : ''}`}
              onClick={() => setPlatform(p)}
            >
              {p === 'all' ? 'All' : p === 'polymarket' ? 'Polymarket' : 'Kalshi'}
            </button>
          ))}
        </div>
        <select className="em-select" value={minSize} onChange={e => setMinSize(e.target.value)}>
          {SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div className="wt-live-indicator">
          <span className={`refresh-dot ${isPro ? '' : 'stale'}`} />
          {isPro
            ? `Live · ${countdown}s`
            : <span className="wt-demo-label">Preview — upgrade for live data</span>
          }
          {isPro && (
            <button
              className={`refresh-btn ${loading ? 'refreshing' : ''}`}
              onClick={() => fetchTrades(true)}
              disabled={loading}
              title="Refresh now"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="upgrade-overlay-wrapper">
        <div className="wt-table">
          <div className="wt-thead">
            <span className="wt-col-time">Time</span>
            <span className="wt-col-market">Market</span>
            <span className="wt-col-side">Side</span>
            <span className="wt-col-platform">Platform</span>
            <span className="wt-col-size">Size</span>
            <span className="wt-col-tier">Tier</span>
          </div>

          <div className="wt-tbody">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="wt-row">
                <span className="wt-col-time"><div className="em-skel em-skel-sm" /></span>
                <span className="wt-col-market"><div className="em-skel" /></span>
                <span className="wt-col-side"><div className="em-skel em-skel-xs" /></span>
                <span className="wt-col-platform"><div className="em-skel em-skel-xs" /></span>
                <span className="wt-col-size"><div className="em-skel em-skel-sm" /></span>
                <span className="wt-col-tier"><div className="em-skel em-skel-xs" /></span>
              </div>
            ))}

            {!loading && visibleTrades.map((t, i) => (
              <TradeRow key={i} trade={t} now={now} />
            ))}

            {!loading && blurredTrades.map((t, i) => (
              <div key={`blur-${i}`} className="mt-blurred">
                <TradeRow trade={t} now={now} />
              </div>
            ))}

            {!loading && isPro && trades.length === 0 && (
              <div className="whale-empty">No trades found matching filters</div>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="upgrade-overlay">
            <div className="upgrade-card">
              <h3>Live insider data is Pro</h3>
              <p>See every $5K+ trade in real time, filtered by category. Follow where informed money is moving across Polymarket and Kalshi.</p>
              <a href="/pricing" className="upgrade-btn">Upgrade to Pro</a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function TradeRow({ trade: t }) {
  const sideIsYes = t.side?.toUpperCase() === 'YES'
  const tier = sizeTier(t.dollarValue || 0)

  return (
    <div className="wt-row wt-row-notable">
      <span className="wt-col-time wt-time">{timeAgo(t.time)}</span>

      <span className="wt-col-market">
        <span className="wt-market-name">
          {t.market?.length > 65 ? t.market.slice(0, 65) + '…' : t.market}
        </span>
        {t.category && t.category !== 'Other' && (
          <span className="wt-category-tag">{t.category}</span>
        )}
      </span>

      <span className="wt-col-side">
        <span className={`wt-side ${sideIsYes ? 'wt-side-yes' : 'wt-side-no'}`}>
          {t.side?.toUpperCase() || '?'}
        </span>
      </span>

      <span className="wt-col-platform">
        <span className={`em-tag ${t.platform === 'polymarket' ? 'em-tag-poly' : 'em-tag-kalshi'}`}>
          {t.platform === 'polymarket' ? 'Poly' : 'Kalshi'}
        </span>
      </span>

      <span className="wt-col-size">
        <span className="wt-size-val wt-size-large">{t.dollarFormatted}</span>
      </span>

      <span className="wt-col-tier">
        <span className={`wt-tier ${tier.cls}`}>{tier.label}</span>
      </span>
    </div>
  )
}
