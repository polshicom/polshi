'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const POLY_COLOR = '#3b82f6'
const KALSHI_COLOR = '#10b981'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="compare-tooltip">
      <div className="compare-tooltip-label">{d.name}</div>
      <div style={{ color: POLY_COLOR }}>{d.polymarket != null ? `Polymarket: ${d.polymarket}%` : ''}</div>
      <div style={{ color: KALSHI_COLOR }}>{d.kalshi != null ? `Kalshi: ${d.kalshi}%` : ''}</div>
      {d.spread != null && <div className="compare-tooltip-spread">Spread: {d.spread}¢</div>}
    </div>
  )
}

export default function CompareChart({ pairs }) {
  if (!pairs || pairs.length === 0) return null

  const data = pairs.map((p, i) => ({
    name: p.question.length > 40 ? p.question.slice(0, 40) + '...' : p.question,
    polymarket: p.polymarket,
    kalshi: p.kalshi,
    spread: Math.abs((p.polymarket || 0) - (p.kalshi || 0)),
  }))

  return (
    <div className="compare-overview-chart">
      <h3 className="compare-overview-title">Probability Comparison</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 60)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={12} />
          <YAxis type="category" dataKey="name" width={180} fontSize={11} tick={{ fill: 'var(--color-text-secondary)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="polymarket" name="Polymarket" fill={POLY_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
          <Bar dataKey="kalshi" name="Kalshi" fill={KALSHI_COLOR} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
      <div className="compare-legend">
        <span className="compare-legend-item"><span className="compare-legend-dot" style={{ background: POLY_COLOR }} /> Polymarket</span>
        <span className="compare-legend-item"><span className="compare-legend-dot" style={{ background: KALSHI_COLOR }} /> Kalshi</span>
      </div>
    </div>
  )
}
