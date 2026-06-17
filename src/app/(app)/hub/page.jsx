'use client'

import { useState, useEffect } from 'react'

function timeAgo(isoStr) {
  if (!isoStr) return ''
  const s = Math.round((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

const TOOLS = [
  {
    title: 'Arbitrage Scanner',
    href: '/arbitrage',
    badge: 'Live',
    badgeType: 'live',
    desc: 'Price gaps between Polymarket and Kalshi, sorted by profit. Fees calculated.',
    iconBg: 'rgba(94,106,210,0.12)',
    iconColor: '#5e6ad2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16l-4-4 4-4" /><path d="M17 8l4 4-4 4" /><line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Whale Tracker',
    href: '/whales',
    badge: 'Pro',
    badgeType: 'pro',
    desc: 'Large trades across both platforms in real time. See what big money is doing.',
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#10b981',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: 'Explore Markets',
    href: '/explore',
    badge: null,
    desc: 'Browse all matched markets across both platforms. Sort by edge, confidence, volume.',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#3b82f6',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
]

const DASHBOARDS = [
  { title: 'Fed Watch', desc: 'Fed rate bets and Fed Chair nomination odds across both platforms', category: 'FINANCE', query: 'fed' },
  { title: 'Bitcoin Price Targets', desc: 'BTC price predictions — where odds diverge across platforms', category: 'FINANCE', query: 'bitcoin' },
  { title: 'Ethereum Price Targets', desc: 'ETH outlook compared across Kalshi and Polymarket', category: 'FINANCE', query: 'ethereum' },
  { title: 'NBA Finals', desc: 'Title odds compared — spot pricing gaps between platforms', category: 'SPORTS', query: 'nba' },
  { title: 'FIFA World Cup', desc: 'World Cup winner odds across Kalshi and Polymarket', category: 'SPORTS', query: 'world cup' },
  { title: 'NHL Stanley Cup', desc: 'Stanley Cup odds compared between prediction markets', category: 'SPORTS', query: 'stanley cup' },
  { title: '2028 Presidential Race', desc: 'Nomination and election odds — where the money is going', category: 'POLITICS', query: 'presidential' },
  { title: 'Trump Markets', desc: 'Every prediction market involving Trump across both platforms', category: 'POLITICS', query: 'trump' },
]

const CATEGORIES = ['All', 'Sports', 'Finance', 'Politics']

function formatVol(vol) {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export default function HubPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [stats, setStats] = useState(null)
  const [previews, setPreviews] = useState({})
  const [whales, setWhales] = useState([])

  useEffect(() => {
    fetch('/api/scanner-stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/whales?minSize=1000')
      .then(r => r.json())
      .then(data => {
        const trades = data.trades || []
        trades.sort((a, b) => b.dollarValue - a.dollarValue)
        setWhales(trades.slice(0, 5))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/explore-matched?limit=500')
      .then(r => r.json())
      .then(data => {
        const markets = data.markets || []
        const map = {}
        for (const d of DASHBOARDS) {
          const words = d.query.toLowerCase().split(/\s+/).filter(w => w.length >= 2)
          const matched = markets.filter(m => {
            const q = m.question.toLowerCase()
            return words.every(w => q.includes(w))
          })
          const sorted = matched.sort((a, b) => (b.volume || 0) - (a.volume || 0))
          map[d.query] = {
            count: matched.length,
            top: sorted.slice(0, 2).map(m => ({
              question: m.question.length > 45 ? m.question.slice(0, 45) + '…' : m.question,
              vol: formatVol(m.volume || 0),
            })),
          }
        }
        setPreviews(map)
      })
      .catch(() => {})
  }, [])

  const filtered = activeCategory === 'All'
    ? DASHBOARDS
    : DASHBOARDS.filter(d => d.category === activeCategory.toUpperCase())

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Command Center</h1>
          <p className="dashboard-subtitle">Your arb tools, market dashboards, and whale feeds.</p>
        </div>
      </div>

      {/* Live stats strip */}
      {stats && (
        <div className="hub-stats-strip">
          <div className="hub-stat">
            <span className="hub-stat-val">{stats.scanned?.toLocaleString() ?? '—'}</span>
            <span className="hub-stat-label">markets scanned</span>
          </div>
          <div className="hub-stat-divider" />
          <div className="hub-stat">
            <span className="hub-stat-val hub-stat-green">{stats.arbCount ?? '—'}</span>
            <span className="hub-stat-label">price gaps found</span>
          </div>
          <div className="hub-stat-divider" />
          <div className="hub-stat">
            <span className="hub-stat-val hub-stat-green">
              {stats.totalEdge > 0
                ? stats.totalEdge >= 1000
                  ? `$${(stats.totalEdge / 1000).toFixed(0)}K`
                  : `$${Math.round(stats.totalEdge)}`
                : '—'}
            </span>
            <span className="hub-stat-label">total edge available</span>
          </div>
          <div className="hub-stat-divider" />
          <div className="hub-stat">
            <span className="hub-stat-pulse" />
            <span className="hub-stat-label">{stats.lastUpdated ? `updated ${timeAgo(stats.lastUpdated)}` : 'live'}</span>
          </div>
        </div>
      )}

      {/* Tool cards */}
      <div className="hub-tools">
        <div className="hub-tools-grid">
          {TOOLS.map(tool => (
            <a key={tool.title} href={tool.href} className="hub-tool-card">
              <div className="hub-tool-top">
                <div className="hub-tool-icon" style={{ background: tool.iconBg, color: tool.iconColor }}>
                  {tool.icon}
                </div>
                {tool.badge && (
                  <span className={`hub-tool-badge hub-tool-badge-${tool.badgeType}`}>
                    {tool.badgeType === 'live' && <span className="hub-tool-live-dot" />}
                    {tool.badge}
                  </span>
                )}
              </div>
              <h3 className="hub-tool-title">{tool.title}</h3>
              <p className="hub-tool-desc">{tool.desc}</p>
              <span className="hub-tool-cta">Open →</span>
            </a>
          ))}
        </div>
      </div>

      {/* Whale feed */}
      {whales.length > 0 && (
        <div className="hub-whales">
          <div className="hub-section-header">
            <h2 className="hub-section-title">Largest Trades Today</h2>
            <a href="/whales" className="hub-section-link">View all →</a>
          </div>
          <div className="hub-whale-table">
            {whales.map((w, i) => {
              const sideYes = w.side?.toUpperCase() === 'YES'
              return (
                <a key={i} href="/whales" className="hub-whale-row">
                  <span className="hub-whale-market">
                    {w.market?.length > 55 ? w.market.slice(0, 55) + '…' : w.market}
                  </span>
                  <span className={`hub-whale-side ${sideYes ? 'side-yes' : 'side-no'}`}>
                    {w.side?.toUpperCase() || '?'}
                  </span>
                  <span className={`em-tag ${w.platform === 'polymarket' ? 'em-tag-poly' : 'em-tag-kalshi'}`}>
                    {w.platform === 'polymarket' ? 'Poly' : 'Kalshi'}
                  </span>
                  <span className="hub-whale-value">{w.dollarFormatted}</span>
                  <span className="hub-whale-time">{timeAgo(w.time)}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Market dashboards */}
      <div className="hub-dashboards">
        <div className="hub-section-header">
          <h2 className="hub-section-title">Market Dashboards</h2>
        </div>
        <p className="hub-dashboards-subtitle">
          Compare odds by category. Live data from both platforms.
        </p>

        <div className="hub-category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`hub-category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="hub-dashboards-grid">
          {filtered.map(d => {
            const preview = previews[d.query]
            return (
              <a
                key={d.title}
                href={`/compare?q=${encodeURIComponent(d.query)}`}
                className="hub-dashboard-card"
              >
                <div className="hub-dashboard-header">
                  <span className="hub-dashboard-category">{d.category}</span>
                  {preview?.count > 0 && (
                    <span className="hub-dashboard-count">{preview.count} markets</span>
                  )}
                </div>
                <h3 className="hub-dashboard-title">{d.title}</h3>
                <p className="hub-dashboard-desc">{d.desc}</p>
                {preview?.top?.length > 0 && (
                  <div className="hub-card-preview">
                    {preview.top.map((m, i) => (
                      <div key={i} className="hub-card-preview-row">
                        <span className="hub-card-preview-q">{m.question}</span>
                        <span className="hub-card-preview-val">{m.vol}</span>
                      </div>
                    ))}
                  </div>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </>
  )
}
