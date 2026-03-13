export default function WhyPolshi() {
  return (
    <section className="why-section">
      <div className="why-grid">
        <div className="why-card">
          <div className="why-card-icon arb">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div className="why-card-title">Track Arbitrage</div>
          <div className="why-card-desc">Find pricing gaps between Polymarket and Kalshi in real time.</div>
        </div>
        <div className="why-card">
          <div className="why-card-icon whale">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="why-card-title">Follow Whale Trades</div>
          <div className="why-card-desc">See what big money is doing across prediction markets.</div>
        </div>
        <div className="why-card">
          <div className="why-card-icon compare">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </div>
          <div className="why-card-title">Compare Markets</div>
          <div className="why-card-desc">Unified view of every event across both platforms.</div>
        </div>
      </div>
    </section>
  )
}
