'use client'

import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'

const POLY_COLOR = '#3b82f6'
const KALSHI_COLOR = '#10b981'

function formatVolume(vol) {
  if (!vol) return '$0'
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function timeLeft(endDate) {
  if (!endDate) return null
  const diff = new Date(endDate) - Date.now()
  if (diff < 0) return 'Ended'
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `${days}d left`
  const hrs = Math.floor(diff / 3600000)
  return hrs > 0 ? `${hrs}h left` : 'Today'
}

export default function CompareCard({ pair }) {
  const spread = Math.abs((pair.polymarket || 0) - (pair.kalshi || 0))

  const chartData = [
    { name: 'Polymarket', value: pair.polymarket || 0 },
    { name: 'Kalshi', value: pair.kalshi || 0 },
  ]

  return (
    <div className="compare-card">
      <div className="compare-card-question">{pair.question}</div>

      <div className="compare-card-chart">
        <ResponsiveContainer width="100%" height={70}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
              <Cell fill={POLY_COLOR} />
              <Cell fill={KALSHI_COLOR} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="compare-card-stats">
        <div className="compare-card-platform">
          <span className="badge-polymarket">Polymarket</span>
          <span className="compare-card-prob">{pair.polymarket != null ? `${pair.polymarket}%` : '—'}</span>
          {pair.polyVolume != null && <span className="compare-card-vol">{formatVolume(pair.polyVolume)}</span>}
          {pair.polyUrl && <a href={pair.polyUrl} target="_blank" rel="noopener noreferrer" className="compare-card-link">View</a>}
        </div>
        <div className="compare-card-vs">vs</div>
        <div className="compare-card-platform">
          <span className="badge-kalshi">Kalshi</span>
          <span className="compare-card-prob">{pair.kalshi != null ? `${pair.kalshi}%` : '—'}</span>
          {pair.kalshiVolume != null && <span className="compare-card-vol">{formatVolume(pair.kalshiVolume)}</span>}
          {pair.kalshiUrl && <a href={pair.kalshiUrl} target="_blank" rel="noopener noreferrer" className="compare-card-link">View</a>}
        </div>
      </div>

      <div className="compare-card-footer">
        {spread > 0 && (
          <span className={`compare-card-spread ${spread >= 3 ? 'spread-high' : ''}`}>
            {spread}¢ spread
          </span>
        )}
        {pair.endDate && <span className="compare-card-time">{timeLeft(pair.endDate)}</span>}
        {pair.category && <span className="compare-card-cat">{pair.category}</span>}
      </div>
    </div>
  )
}
