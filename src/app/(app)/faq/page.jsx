'use client'

import { useState } from 'react'

export default function FAQPage() {
  return (
    <div className="faq-page">
      <div className="faq-page-hero">
        <div className="faq-page-badge">Learn</div>
        <h1 className="faq-page-title">How prediction market arbitrage works</h1>
        <p className="faq-page-subtitle">
          A step-by-step guide to risk-free profit from pricing gaps between Polymarket and Kalshi.
        </p>
      </div>

      {/* What is arbitrage */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">What is arbitrage?</h2>
        <p className="faq-section-text">
          Arbitrage is when you buy the same thing on two different markets at two different prices, locking in a guaranteed profit regardless of the outcome. In prediction markets, this happens when Polymarket and Kalshi price the same event differently.
        </p>
        <p className="faq-section-text">
          On both platforms, you can buy <strong>YES</strong> or <strong>NO</strong> shares on any event. Each share pays out $1.00 if correct, $0 if wrong. Prices range from $0.01 to $0.99.
        </p>
      </section>

      {/* Visual example */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">A real example</h2>
        <p className="faq-section-text">
          Say both platforms have the market: <em>"Will Bitcoin hit $150K before July 2026?"</em>
        </p>

        <div className="faq-example">
          <div className="faq-example-header">The setup</div>
          <div className="faq-platforms">
            <div className="faq-platform faq-platform-poly">
              <span className="faq-platform-label">Polymarket</span>
              <div className="faq-price-box">
                <span className="faq-price-side">YES</span>
                <span className="faq-price-val">52¢</span>
              </div>
              <div className="faq-price-box faq-price-dim">
                <span className="faq-price-side">NO</span>
                <span className="faq-price-val">48¢</span>
              </div>
            </div>
            <div className="faq-platform-divider">
              <span className="faq-vs">vs</span>
            </div>
            <div className="faq-platform faq-platform-kalshi">
              <span className="faq-platform-label">Kalshi</span>
              <div className="faq-price-box faq-price-dim">
                <span className="faq-price-side">YES</span>
                <span className="faq-price-val">58¢</span>
              </div>
              <div className="faq-price-box">
                <span className="faq-price-side">NO</span>
                <span className="faq-price-val">42¢</span>
              </div>
            </div>
          </div>
        </div>

        <p className="faq-section-text">
          Notice the gap: Polymarket thinks YES is worth 52¢, but Kalshi prices NO at only 42¢. That's your edge.
        </p>
      </section>

      {/* The trade */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">The trade</h2>
        <p className="faq-section-text">You make two purchases simultaneously:</p>

        <div className="faq-trade-steps">
          <div className="faq-trade-step">
            <div className="faq-step-num">1</div>
            <div className="faq-step-content">
              <div className="faq-step-title">Buy YES on Polymarket</div>
              <div className="faq-step-detail">
                <span className="faq-step-platform poly">Polymarket</span>
                <span className="faq-step-action">Buy YES @ 52¢</span>
              </div>
            </div>
          </div>
          <div className="faq-trade-step">
            <div className="faq-step-num">2</div>
            <div className="faq-step-content">
              <div className="faq-step-title">Buy NO on Kalshi</div>
              <div className="faq-step-detail">
                <span className="faq-step-platform kalshi">Kalshi</span>
                <span className="faq-step-action">Buy NO @ 42¢</span>
              </div>
            </div>
          </div>
        </div>

        <div className="faq-cost-box">
          <div className="faq-cost-row">
            <span>Total cost</span>
            <span className="faq-cost-val">52¢ + 42¢ = <strong>94¢</strong></span>
          </div>
          <div className="faq-cost-row">
            <span>Guaranteed payout</span>
            <span className="faq-cost-val"><strong>$1.00</strong></span>
          </div>
          <div className="faq-cost-row faq-cost-profit">
            <span>Guaranteed profit</span>
            <span className="faq-cost-val"><strong>6¢ per share</strong></span>
          </div>
        </div>
      </section>

      {/* Why it works */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">Why does this always work?</h2>
        <p className="faq-section-text">
          There are only two possible outcomes. In both cases, exactly one of your positions pays out $1.00:
        </p>

        <div className="faq-outcomes">
          <div className="faq-outcome">
            <div className="faq-outcome-label faq-outcome-yes">Bitcoin DOES hit $150K</div>
            <div className="faq-outcome-body">
              <div className="faq-outcome-row">
                <span>Your Polymarket YES share pays out</span>
                <span className="faq-outcome-green">+$1.00</span>
              </div>
              <div className="faq-outcome-row">
                <span>Your Kalshi NO share expires worthless</span>
                <span className="faq-outcome-red">$0.00</span>
              </div>
              <div className="faq-outcome-row faq-outcome-total">
                <span>Net profit</span>
                <span className="faq-outcome-green">$1.00 − $0.94 = <strong>+6¢</strong></span>
              </div>
            </div>
          </div>
          <div className="faq-outcome">
            <div className="faq-outcome-label faq-outcome-no">Bitcoin does NOT hit $150K</div>
            <div className="faq-outcome-body">
              <div className="faq-outcome-row">
                <span>Your Polymarket YES share expires worthless</span>
                <span className="faq-outcome-red">$0.00</span>
              </div>
              <div className="faq-outcome-row">
                <span>Your Kalshi NO share pays out</span>
                <span className="faq-outcome-green">+$1.00</span>
              </div>
              <div className="faq-outcome-row faq-outcome-total">
                <span>Net profit</span>
                <span className="faq-outcome-green">$1.00 − $0.94 = <strong>+6¢</strong></span>
              </div>
            </div>
          </div>
        </div>

        <p className="faq-section-text">
          Same profit either way. That's arbitrage — you're not betting on an outcome, you're capturing a pricing error between two platforms.
        </p>
      </section>

      {/* Scale */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">Scaling up</h2>
        <p className="faq-section-text">
          The 6¢ profit is per share. Buy more shares to scale:
        </p>

        <div className="faq-scale-table">
          <div className="faq-scale-header">
            <span>Shares</span>
            <span>Cost</span>
            <span>Payout</span>
            <span>Profit</span>
            <span>ROI</span>
          </div>
          <div className="faq-scale-row">
            <span>100</span>
            <span>$94</span>
            <span>$100</span>
            <span className="faq-outcome-green">$6</span>
            <span>6.4%</span>
          </div>
          <div className="faq-scale-row">
            <span>1,000</span>
            <span>$940</span>
            <span>$1,000</span>
            <span className="faq-outcome-green">$60</span>
            <span>6.4%</span>
          </div>
          <div className="faq-scale-row">
            <span>10,000</span>
            <span>$9,400</span>
            <span>$10,000</span>
            <span className="faq-outcome-green">$600</span>
            <span>6.4%</span>
          </div>
        </div>
      </section>

      {/* What Polshi does */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">What Polshi does for you</h2>
        <div className="faq-features-grid">
          <div className="faq-feature-card">
            <div className="faq-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h3>Real-time scanning</h3>
            <p>We scan Polymarket and Kalshi every 30 seconds, comparing thousands of markets to find pricing gaps before they close.</p>
          </div>
          <div className="faq-feature-card">
            <div className="faq-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M10 3v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/></svg>
            </div>
            <h3>AI matching</h3>
            <p>Markets on different platforms use different wording. Our AI matches them by analyzing entities, topics, dates, and resolution criteria.</p>
          </div>
          <div className="faq-feature-card">
            <div className="faq-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L2 7l8 5 8-5-8-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 13l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>
            </div>
            <h3>Edge calculator</h3>
            <p>For every match, we calculate the exact edge, total cost, ROI, and which side to buy on which platform — ready to execute.</p>
          </div>
          <div className="faq-feature-card">
            <div className="faq-feature-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h3>Whale tracking</h3>
            <p>See when large traders make big moves. Whale activity often signals where the smart money sees value — and where arbs are about to close.</p>
          </div>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="faq-section-block">
        <h2 className="faq-section-heading">Common questions</h2>
        <div className="faq-accordion">
          <FAQ q="What's the catch?" a="The main limitation is liquidity. Not every arb can be filled at the displayed price, especially at large sizes. Slippage, fees, and withdrawal times can reduce your effective profit. Polshi shows gross edge — always factor in platform fees (typically 1-2%) before executing." />
          <FAQ q="Is this legal?" a="Yes. Prediction market arbitrage is legal in the US. Both Polymarket and Kalshi are regulated platforms. You're buying shares at publicly available prices — there's no insider trading or manipulation involved." />
          <FAQ q="How much money do I need to start?" a="You can start with as little as $10-20 on each platform. Most arb opportunities have minimum share sizes of $1. The ROI is the same whether you buy 10 shares or 10,000 — you just need enough to cover both sides." />
          <FAQ q="How long until I get paid?" a="Prediction market shares pay out when the event resolves — which could be days, weeks, or months depending on the market. Your profit is locked in the moment you buy both sides, but the cash settles when the market closes." />
          <FAQ q="What if the price changes before I buy both sides?" a="Speed matters. Prices move fast, and arbs can close in seconds. That's why Polshi shows live prices with 15-second updates for Pro users — so you can spot and execute before the gap disappears." />
          <FAQ q="Do I need accounts on both platforms?" a="Yes. To execute an arb, you need to buy on both Polymarket and Kalshi simultaneously. You'll need a funded account on each platform." />
          <FAQ q="What are the platform fees?" a="Polymarket charges no trading fees but has a small withdrawal fee. Kalshi charges a fee on winning trades (typically 1-3%). Always factor fees into your profit calculation — a 2¢ arb might not be profitable after fees, but a 6¢ arb usually is." />
          <FAQ q="Can I lose money?" a="If the match is correct (same event, same resolution criteria), the trade is risk-free by definition. The risk comes from bad matches — two markets that look similar but resolve differently. That's why Polshi uses AI verification to confirm matches." />
        </div>
      </section>

      <div className="faq-page-cta">
        <a href="/arbitrage" className="faq-cta-btn">
          Open the scanner
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        <a href="/pricing" className="faq-cta-link">View pricing plans</a>
      </div>
    </div>
  )
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-acc-item ${open ? 'open' : ''}`}>
      <button className="faq-acc-q" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <svg className="faq-acc-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="faq-acc-a">
        <p>{a}</p>
      </div>
    </div>
  )
}
