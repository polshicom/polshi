export default function ProSection() {
  return (
    <section className="ai-section">
      <div className="ai-label">
        <span className="ai-dot"></span>
        Pro features <span style={{ fontSize: '12px' }}>&rsaquo;</span>
      </div>
      <h2 className="ai-heading">The full toolkit for serious traders</h2>
      <p className="ai-description">
        <strong>Polshi Pro</strong> is your one-stop shop for prediction markets: cross-platform arbitrage scanning, whale tracking to follow smart money, an explore page with 3,800+ markets, custom watchlists with Discord alerts, and 15-second data refresh. One good arb pays for the month.
      </p>
      <a href="/signup" className="ai-learn-more">
        Start free trial <span>&rsaquo;</span>
      </a>
      <div className="agent-ui">
        <div className="agent-card">
          <div className="agent-search">|Search arb opportunities...</div>
          <div className="agent-list">
            <div className="agent-item selected">
              <div className="agent-avatar" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>8c</div>
              <span className="agent-name">Fed rate cut June 2026</span>
              <span className="agent-badge">Arb found</span>
              <span className="agent-check">&check;</span>
            </div>
            <div className="agent-item">
              <div className="agent-avatar" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 600 }}>5c</div>
              <span className="agent-name">Bitcoin above $150K</span>
              <span className="agent-badge">Watching</span>
            </div>
            <div className="agent-item">
              <div className="agent-avatar" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '11px', fontWeight: 600 }}>3c</div>
              <span className="agent-name">Lakers win NBA Finals</span>
              <span className="agent-badge">Watching</span>
            </div>
            <div className="agent-item">
              <div className="agent-avatar" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>6c</div>
              <span className="agent-name">US recession 2026</span>
              <span className="agent-badge">Arb found</span>
            </div>
            <div className="agent-item">
              <div className="agent-avatar" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>4c</div>
              <span className="agent-name">Man City Champions League</span>
              <span className="agent-badge">Watching</span>
            </div>
            <div className="agent-item">
              <div className="agent-avatar" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: '11px', fontWeight: 600 }}>7c</div>
              <span className="agent-name">Greenland acquisition</span>
              <span className="agent-badge">Arb found</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
