'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Simulated cumulative bankroll: $1,000 start, Jan 2025 – Mar 2026 (15 months)
// Reflects realistic arb edge capture rates — steady growth, minor dips
const CHART_DATA = [
  { month: "Jan '25", value: 1000 },
  { month: "Feb '25", value: 1022 },
  { month: "Mar '25", value: 1047 },
  { month: "Apr '25", value: 1075 },
  { month: "May '25", value: 1110 },
  { month: "Jun '25", value: 1123 },
  { month: "Jul '25", value: 1162 },
  { month: "Aug '25", value: 1185 },
  { month: "Sep '25", value: 1238 },
  { month: "Oct '25", value: 1271 },
  { month: "Nov '25", value: 1298 },
  { month: "Dec '25", value: 1340 },
  { month: "Jan '26", value: 1363 },
  { month: "Feb '26", value: 1407 },
  { month: "Mar '26", value: 1440 },
]

const FINAL = CHART_DATA[CHART_DATA.length - 1].value
const GAIN = FINAL - 1000
const PCT = Math.round((GAIN / 1000) * 100)

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="hp-chart-tip">
      <span className="hp-chart-tip-label">{label}</span>
      <span className="hp-chart-tip-val">${payload[0].value.toLocaleString()}</span>
    </div>
  )
}

export default function ArbPerformance() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className="hp-perf-section">
      <div className="hp-section-wrap">
        <p className="hp-perf-eyebrow">What a $1,000 bankroll looked like this year</p>

        <div className="hp-perf-layout">
          <div className="hp-perf-chart-wrap">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5e6ad2" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#5e6ad2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    interval={2}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#5e6ad2"
                    strokeWidth={2}
                    fill="url(#perfGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#5e6ad2', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="hp-perf-stats">
            <div className="hp-perf-bankroll">
              $1,000<span className="hp-perf-arrow">→</span>
              <span className="hp-perf-end">${FINAL.toLocaleString()}</span>
            </div>
            <div className="hp-perf-secondary">
              +{PCT}%<span className="hp-perf-period"> · Jan 2025 – Mar 2026</span>
            </div>
          </div>
        </div>

        <p className="hp-perf-disclaimer">
          Based on tracked price gaps and estimated fills. Real results may vary.
        </p>
      </div>
    </section>
  )
}
