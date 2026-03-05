'use client'

import { useState, useEffect, useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'

const FALLBACK_MARKETS = [
  { question: 'Will the Fed cut rates at June FOMC?', category: 'Economics', polymarket: 62, kalshi: 48, confidence: 'High', volume: '$14.2M', updated: '1m ago' },
  { question: 'Bitcoin above $200K by Dec 2026?', category: 'Crypto', polymarket: 34, kalshi: 21, confidence: 'High', volume: '$9.8M', updated: '2m ago' },
  { question: 'US enters recession in 2026?', category: 'Economics', polymarket: 41, kalshi: 29, confidence: 'High', volume: '$11.5M', updated: '1m ago' },
  { question: 'SpaceX Starship reaches orbit by Q2?', category: 'Tech', polymarket: 78, kalshi: 65, confidence: 'Medium', volume: '$5.3M', updated: '3m ago' },
  { question: 'Tesla Robotaxi launches in 2026?', category: 'Tech', polymarket: 29, kalshi: 18, confidence: 'High', volume: '$7.1M', updated: '2m ago' },
  { question: 'Trump wins 2028 Republican primary?', category: 'Politics', polymarket: 55, kalshi: 42, confidence: 'High', volume: '$18.6M', updated: '1m ago' },
  { question: 'Apple announces foldable device?', category: 'Tech', polymarket: 22, kalshi: 12, confidence: 'Medium', volume: '$3.4M', updated: '4m ago' },
  { question: 'Ethereum flips Bitcoin market cap?', category: 'Crypto', polymarket: 8, kalshi: 3, confidence: 'Low', volume: '$2.1M', updated: '5m ago' },
]

function MarketItem({ market }) {
  const diff = Math.abs(market.polymarket - market.kalshi)
  const diffSign = market.polymarket > market.kalshi ? '+' : '-'
  return (
    <div className="inbox-item">
      <div className="inbox-avatar" style={{
        fontSize: '10px',
        fontWeight: 600,
        color: diff >= 5 ? '#34d399' : '#f59e0b',
        background: diff >= 5 ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
      }}>
        {diffSign}{diff}
      </div>
      <div className="inbox-content">
        <div className="inbox-item-title">{market.question}</div>
        <div className="inbox-item-subtitle">
          PM {market.polymarket}¢ vs K {market.kalshi}¢ · {market.volume}
        </div>
      </div>
      <div className="inbox-meta">
        <span className="inbox-time">{market.updated}</span>
        <div className={`inbox-status ${market.confidence === 'High' ? 'success' : market.confidence === 'Medium' ? 'warning' : 'info'}`}></div>
      </div>
    </div>
  )
}

export default function AppScreenshot() {
  const [markets, setMarkets] = useState(FALLBACK_MARKETS)

  useEffect(() => {
    fetch('/api/markets?confidence=all&limit=8')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.markets?.length) setMarkets(data.markets)
      })
      .catch(() => {})
  }, [])

  const selected = markets[0]

  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0])
  const scale = useTransform(scrollYProgress, [0, 0.8], [1.05, 1])

  return (
    <div ref={containerRef} className="app-screenshot-scroll">
      <div className="app-screenshot">
        <motion.div className="app-screenshot-inner" style={{ rotateX: rotate, scale }}>
          <div className="screenshot-container">
            {/* Sidebar */}
          <div className="screenshot-sidebar">
            <div className="sidebar-window-controls">
              <div className="window-dot"></div>
              <div className="window-dot"></div>
              <div className="window-dot"></div>
            </div>
            <div className="sidebar-workspace">
              <div className="workspace-icon">
                <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
                  <circle cx="38" cy="50" r="28" stroke="#a78bfa" strokeWidth="6" fill="none" />
                  <circle cx="62" cy="50" r="28" stroke="#a78bfa" strokeWidth="6" fill="none" />
                </svg>
              </div>
              <span className="workspace-name">Polshi</span>
              <span className="workspace-badge">6</span>
            </div>
            <div className="sidebar-nav-item active">
              <span className="sidebar-nav-icon">&#x25CE;</span>
              Discover
            </div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon">&#x2606;</span>
              Watchlist
            </div>
            <div className="sidebar-section-title">Markets</div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon">&#x2691;</span>
              Politics
            </div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon">&#x25C6;</span>
              Economics
            </div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon">&#x20BF;</span>
              Crypto
            </div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon">&#x229E;</span>
              Tech
            </div>
            <div className="sidebar-section-title">Pro</div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon" style={{ color: '#6366f1' }}>&#x26A1;</span>
              Alerts
            </div>
            <div className="sidebar-nav-item">
              <span className="sidebar-nav-icon">&#x2630;</span>
              Settings
            </div>
          </div>

          {/* Market List */}
          <div className="screenshot-inbox">
            <div className="inbox-header">
              <span className="inbox-title">Top Spreads</span>
              <div className="inbox-live-dot"></div>
            </div>
            {markets.map((m, i) => (
              <MarketItem key={i} market={m} />
            ))}
          </div>

          {/* Detail */}
          <div className="screenshot-detail">
            <div className="detail-breadcrumb">
              {selected.category} <span>›</span> Details
            </div>
            <h2 className="detail-title">{selected.question}</h2>
            <div className="detail-code-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="code-property" style={{ fontSize: '13px', fontWeight: 500 }}>Platform</span>
                <span className="code-property" style={{ fontSize: '13px', fontWeight: 500 }}>Price</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="code-type">Polymarket</span>
                <span style={{ color: '#f7f8f8', fontWeight: 500 }}>{selected.polymarket}¢</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="code-keyword">Kalshi</span>
                <span style={{ color: '#f7f8f8', fontWeight: 500 }}>{selected.kalshi}¢</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginBottom: '8px' }}>
                <span className="code-comment">Spread</span>
                <span style={{ float: 'right', color: '#34d399', fontWeight: 600, fontSize: '14px' }}>{Math.abs(selected.polymarket - selected.kalshi)}¢</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span className="code-comment">AI Confidence</span>
                <span style={{ float: 'right', color: '#34d399' }}>97%</span>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span className="code-comment">Combined volume</span>
                <span style={{ float: 'right', color: 'var(--color-text-secondary)' }}>{selected.volume}</span>
              </div>
              <div>
                <span className="code-comment">Last updated</span>
                <span style={{ float: 'right', color: 'var(--color-text-secondary)' }}>{selected.updated}</span>
              </div>
            </div>
          </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
