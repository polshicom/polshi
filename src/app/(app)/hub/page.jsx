'use client'

import { useState, useEffect } from 'react'

const TOOLS = [
  {
    title: 'Arbitrage Scanner',
    description: 'Scans both platforms for pricing mismatches in real time. Shows net profit after fees, ROI, and which side to buy.',
    href: '/arbitrage',
    badge: 'Live Scanner',
    tags: ['Dual-Platform', 'Fee Breakdown', 'Live Data'],
    large: true,
  },
  {
    title: 'Volume Dashboard',
    description: 'Ranked by 24h volume',
    href: '/volume',
    icon: '📈',
  },
  {
    title: 'Whale Tracking',
    description: 'Big-money trade feed',
    href: '/whales',
    icon: '🐋',
  },
]

const DASHBOARDS = [
  { title: 'Market Dominance', description: 'Which platform is capturing more volume and liquidity right now', category: 'FINANCE', type: 'dominance' },
  { title: 'Fed Watch', description: 'Fed rate bets and Fed Chair nomination odds across both platforms', category: 'FINANCE', query: 'fed' },
  { title: 'Bitcoin Price Targets', description: 'Compare BTC price predictions and see where odds diverge', category: 'FINANCE', query: 'bitcoin' },
  { title: 'Ethereum Price Targets', description: 'ETH price outlook compared across both platforms', category: 'FINANCE', query: 'ethereum' },
  { title: 'NBA Finals', description: 'NBA title odds compared — spot pricing gaps between platforms', category: 'SPORTS', query: 'nba' },
  { title: 'FIFA World Cup', description: 'World Cup winner odds across Kalshi and Polymarket', category: 'SPORTS', query: 'world cup' },
  { title: 'NHL Stanley Cup', description: 'Stanley Cup odds compared between prediction markets', category: 'SPORTS', query: 'stanley cup' },
  { title: '2028 Presidential Race', description: 'Presidential nomination and election odds — where the money is going', category: 'POLITICS', query: 'presidential' },
  { title: 'Trump Markets', description: 'Every prediction market involving Trump across both platforms', category: 'POLITICS', query: 'trump' },
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
  const [previews, setPreviews] = useState({})

  // Fetch preview data for dashboard cards
  useEffect(() => {
    fetch('/api/explore?limit=500')
      .then(r => r.json())
      .then(data => {
        const markets = data.markets || []
        const previewMap = {}

        for (const d of DASHBOARDS) {
          if (d.type) continue // skip dominance
          const q = d.query.toLowerCase()
          const words = q.split(/\s+/).filter(w => w.length >= 2)
          const matched = markets.filter(m => {
            const question = m.question.toLowerCase()
            return words.every(w => question.includes(w))
          })
          const sorted = matched.sort((a, b) => (b.volume || 0) - (a.volume || 0))
          previewMap[d.query] = {
            count: matched.length,
            top: sorted.slice(0, 2).map(m => ({
              question: m.question.length > 45 ? m.question.slice(0, 45) + '...' : m.question,
              vol: formatVol(m.volume || 0),
              prob: m.prob,
            })),
          }
        }

        // Dominance preview: total volume
        const polyVol = markets.filter(m => m.platform === 'polymarket').reduce((s, m) => s + (m.volume || 0), 0)
        const kalshiVol = markets.filter(m => m.platform === 'kalshi').reduce((s, m) => s + (m.volume || 0), 0)
        previewMap['_dominance'] = {
          polyVol: formatVol(polyVol),
          kalshiVol: formatVol(kalshiVol),
          totalMarkets: markets.length,
        }

        setPreviews(previewMap)
      })
      .catch(() => {})
  }, [])

  const filtered = activeCategory === 'All'
    ? DASHBOARDS
    : DASHBOARDS.filter(d => d.category === activeCategory.toUpperCase())

  return (
    <>
      {/* Dark hero section */}
      <div className="hub-hero">
        <span className="hub-hero-badge">
          <span className="live-dot" />
          {DASHBOARDS.length}+ Live Dashboards
        </span>
        <h1 className="hub-hero-title">Command Center</h1>
        <p className="hub-hero-subtitle">Your arb tools, market dashboards, and whale feeds — all in one place.</p>
      </div>

      {/* Tools grid */}
      <div className="hub-tools">
        <div className="hub-tools-grid">
          {TOOLS.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              className={`hub-tool-card ${tool.large ? 'hub-tool-large' : ''}`}
            >
              {tool.large ? (
                <>
                  <div className="hub-tool-header">
                    <div className="hub-tool-icon">📈</div>
                    {tool.badge && (
                      <span className="live-badge">
                        <span className="live-dot" />
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="hub-tool-title">{tool.title}</h3>
                  <p className="hub-tool-desc">{tool.description}</p>
                  {tool.tags && (
                    <div className="hub-tool-tags">
                      {tool.tags.map(t => <span key={t} className="hub-tool-tag">{t}</span>)}
                    </div>
                  )}
                  <span className="hub-tool-link">Launch Scanner →</span>
                </>
              ) : (
                <>
                  <div className="hub-tool-icon-sm">{tool.icon}</div>
                  <div>
                    <h3 className="hub-tool-title-sm">{tool.title}</h3>
                    <p className="hub-tool-desc-sm">{tool.description}</p>
                  </div>
                  <svg className="hub-tool-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Featured dashboards */}
      <div className="hub-dashboards">
        <h2 className="hub-dashboards-heading">Market Dashboards</h2>
        <p className="hub-dashboards-subtitle">
          Compare odds across platforms by category. Every dashboard pulls live data from both Kalshi and Polymarket.
        </p>

        <div className="hub-category-tabs">
          {CATEGORIES.map((cat) => (
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
          {filtered.map((d) => {
            const preview = d.type === 'dominance' ? previews['_dominance'] : previews[d.query]
            return (
              <a
                key={d.title}
                href={d.type ? `/compare?type=${d.type}` : `/compare?q=${encodeURIComponent(d.query)}`}
                className="hub-dashboard-card"
              >
                <div className="hub-dashboard-header">
                  <span className="hub-dashboard-category">{d.category}</span>
                  {preview && !d.type && preview.count > 0 && (
                    <span className="hub-dashboard-count">{preview.count} markets</span>
                  )}
                  {!preview && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                  )}
                </div>
                <h3 className="hub-dashboard-title">{d.title}</h3>
                <p className="hub-dashboard-desc">{d.description}</p>

                {/* Preview data */}
                {d.type === 'dominance' && preview && (
                  <div className="hub-card-preview">
                    <div className="hub-card-preview-row">
                      <span className="badge-polymarket" style={{ fontSize: 10 }}>Poly</span>
                      <span className="hub-card-preview-val">{preview.polyVol}</span>
                    </div>
                    <div className="hub-card-preview-row">
                      <span className="badge-kalshi" style={{ fontSize: 10 }}>Kalshi</span>
                      <span className="hub-card-preview-val">{preview.kalshiVol}</span>
                    </div>
                  </div>
                )}
                {!d.type && preview && preview.top.length > 0 && (
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
