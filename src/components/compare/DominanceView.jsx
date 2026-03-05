'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

const POLY_COLOR = '#3b82f6'
const KALSHI_COLOR = '#10b981'

function formatVol(v) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="compare-tooltip">
      <div className="compare-tooltip-label">{d.name || d.category}</div>
      <div>{formatVol(d.value || d.polymarket || 0)}</div>
    </div>
  )
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="compare-tooltip">
      <div className="compare-tooltip-label">{d.category}</div>
      <div style={{ color: POLY_COLOR }}>Polymarket: {formatVol(d.polymarket)}</div>
      <div style={{ color: KALSHI_COLOR }}>Kalshi: {formatVol(d.kalshi)}</div>
    </div>
  )
}

export default function DominanceView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/explore?limit=500')
        const json = await res.json()
        const markets = json.markets || []

        const poly = markets.filter(m => m.platform === 'polymarket')
        const kalshi = markets.filter(m => m.platform === 'kalshi')

        const polyVol = poly.reduce((s, m) => s + (m.volume || 0), 0)
        const kalshiVol = kalshi.reduce((s, m) => s + (m.volume || 0), 0)

        // Volume by category
        const catMap = {}
        for (const m of markets) {
          const cat = m.category || 'Other'
          if (!catMap[cat]) catMap[cat] = { polymarket: 0, kalshi: 0 }
          catMap[cat][m.platform] += m.volume || 0
        }

        const byCategory = Object.entries(catMap)
          .map(([category, vols]) => ({ category, ...vols }))
          .sort((a, b) => (b.polymarket + b.kalshi) - (a.polymarket + a.kalshi))
          .slice(0, 8)

        // Top markets by volume from each platform
        const topPoly = [...poly].sort((a, b) => b.volume - a.volume).slice(0, 5)
        const topKalshi = [...kalshi].sort((a, b) => b.volume - a.volume).slice(0, 5)

        setData({
          polyVol, kalshiVol,
          polyCount: poly.length, kalshiCount: kalshi.length,
          byCategory, topPoly, topKalshi,
        })
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="compare-loading">Loading volume data...</div>
  if (!data) return <div className="compare-empty">Failed to load market data.</div>

  const totalVol = data.polyVol + data.kalshiVol
  const polyPct = totalVol > 0 ? ((data.polyVol / totalVol) * 100).toFixed(1) : 0
  const kalshiPct = totalVol > 0 ? ((data.kalshiVol / totalVol) * 100).toFixed(1) : 0

  const overviewData = [
    { name: 'Polymarket', value: data.polyVol },
    { name: 'Kalshi', value: data.kalshiVol },
  ]

  return (
    <>
      {/* Big volume comparison */}
      <div className="dominance-overview">
        <div className="dominance-totals">
          <div className="dominance-platform">
            <span className="badge-polymarket">Polymarket</span>
            <span className="dominance-vol">{formatVol(data.polyVol)}</span>
            <span className="dominance-pct">{polyPct}% of volume</span>
            <span className="dominance-count">{data.polyCount} markets</span>
          </div>
          <div className="dominance-vs">vs</div>
          <div className="dominance-platform">
            <span className="badge-kalshi">Kalshi</span>
            <span className="dominance-vol">{formatVol(data.kalshiVol)}</span>
            <span className="dominance-pct">{kalshiPct}% of volume</span>
            <span className="dominance-count">{data.kalshiCount} markets</span>
          </div>
        </div>

        {/* Volume bar */}
        <div className="dominance-bar-wrap">
          <div className="dominance-bar">
            <div className="dominance-bar-poly" style={{ width: `${polyPct}%` }} />
            <div className="dominance-bar-kalshi" style={{ width: `${kalshiPct}%` }} />
          </div>
          <div className="dominance-bar-labels">
            <span style={{ color: POLY_COLOR }}>Polymarket {polyPct}%</span>
            <span style={{ color: KALSHI_COLOR }}>Kalshi {kalshiPct}%</span>
          </div>
        </div>

        <p className="dominance-insight">
          {Number(polyPct) > 80
            ? `Polymarket currently controls ${polyPct}% of prediction market liquidity. Higher liquidity leads to tighter spreads and more reliable price discovery — making it the primary venue for large trades.`
            : Number(polyPct) > 60
            ? `Polymarket holds ${polyPct}% of total volume while Kalshi captures ${kalshiPct}%. The gap is narrowing — compare prices across both for the best edge.`
            : `Volume is relatively balanced — Polymarket at ${polyPct}% and Kalshi at ${kalshiPct}%. This competition benefits traders with more arbitrage opportunities.`
          }
        </p>
      </div>

      {/* Volume by category */}
      <div className="compare-section">
        <h2 className="compare-section-title">Volume by Category</h2>
        <div className="compare-overview-chart">
          <ResponsiveContainer width="100%" height={Math.max(250, data.byCategory.length * 50)}>
            <BarChart data={data.byCategory} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
              <XAxis type="number" tickFormatter={v => formatVol(v)} fontSize={11} />
              <YAxis type="category" dataKey="category" width={120} fontSize={12} tick={{ fill: 'var(--color-text-secondary)' }} />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="polymarket" name="Polymarket" fill={POLY_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="kalshi" name="Kalshi" fill={KALSHI_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div className="compare-legend">
            <span className="compare-legend-item"><span className="compare-legend-dot" style={{ background: POLY_COLOR }} /> Polymarket</span>
            <span className="compare-legend-item"><span className="compare-legend-dot" style={{ background: KALSHI_COLOR }} /> Kalshi</span>
          </div>
        </div>
      </div>

      {/* Top markets per platform */}
      <div className="dominance-tops">
        <div className="dominance-top-section">
          <h3 className="dominance-top-heading"><span className="badge-polymarket">Polymarket</span> Top by Volume</h3>
          {data.topPoly.map((m, i) => (
            <a key={i} href={m.url || '#'} target="_blank" rel="noopener noreferrer" className="dominance-top-row">
              <span className="dominance-top-q">{m.question}</span>
              <span className="dominance-top-vol">{m.volumeFormatted}</span>
            </a>
          ))}
        </div>
        <div className="dominance-top-section">
          <h3 className="dominance-top-heading"><span className="badge-kalshi">Kalshi</span> Top by Volume</h3>
          {data.topKalshi.map((m, i) => (
            <a key={i} href={m.url || '#'} target="_blank" rel="noopener noreferrer" className="dominance-top-row">
              <span className="dominance-top-q">{m.question}</span>
              <span className="dominance-top-vol">{m.volumeFormatted}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
