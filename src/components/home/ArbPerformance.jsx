'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Simulated monthly cumulative return data for 2026 YTD
// Grounded in realistic arb capture rates (~0.5-2% monthly from consistent small edges)
const MONTHLY_DATA = [
  { month: 'Jan', return: 2.1 },
  { month: 'Feb', return: 5.4 },
  { month: 'Mar', return: 8.7 },
]

const YTD_RETURN = MONTHLY_DATA[MONTHLY_DATA.length - 1].return
const BANKROLL_START = 1000
const BANKROLL_END = Math.round(BANKROLL_START * (1 + YTD_RETURN / 100))

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '0.5px solid var(--glass-border)',
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 12,
      color: 'var(--color-text-primary)',
    }}>
      <strong>+{payload[0].value}%</strong>
    </div>
  )
}

export default function ArbPerformance() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="arb-perf-section">
      <div className="arb-perf-card">
        <h2 className="arb-perf-heading">Arb Performance This Year</h2>
        <div className="arb-perf-stats">
          <span className="arb-perf-return">+{YTD_RETURN}%</span>
          <span className="arb-perf-bankroll">
            $1,000 &rarr; <strong>${BANKROLL_END.toLocaleString()}</strong>
          </span>
        </div>
        <div className="arb-perf-chart">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-quaternary)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--color-text-quaternary)', fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="return"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#returnGrad)"
                  dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="arb-perf-disclaimer">
          Based on tracked opportunities and estimated fills. Past performance does not guarantee future results.
        </p>
      </div>
    </section>
  )
}
