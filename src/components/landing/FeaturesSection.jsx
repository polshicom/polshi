export default function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-card-image">
            <div className="feature-illustration feature-illustration-1">
              <div className="card-stack">
                <div className="floating-card" style={{ padding: '8px', fontSize: '7px', color: 'var(--color-text-quaternary)' }}>
                  <div style={{ marginBottom: '4px', fontWeight: 500, fontSize: '8px', color: 'var(--color-text-tertiary)' }}>Polymarket</div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', width: '80%', marginBottom: '3px', borderRadius: '1px' }}></div>
                  <div style={{ height: '3px', background: 'rgba(52,211,153,0.15)', width: '42%', marginBottom: '3px', borderRadius: '1px' }}></div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.03)', width: '70%', borderRadius: '1px' }}></div>
                </div>
                <div className="floating-card" style={{ padding: '8px', fontSize: '7px', color: 'var(--color-text-quaternary)' }}>
                  <div style={{ marginBottom: '4px', fontWeight: 500, fontSize: '8px', color: 'var(--color-text-tertiary)' }}>Kalshi</div>
                  <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', width: '70%', marginBottom: '3px', borderRadius: '1px' }}></div>
                  <div style={{ height: '3px', background: 'rgba(96,165,250,0.15)', width: '37%', borderRadius: '1px' }}></div>
                </div>
                <div className="floating-card" style={{ padding: '8px', fontSize: '7px', color: 'var(--color-text-quaternary)' }}>
                  <div style={{ marginBottom: '4px', fontWeight: 500, fontSize: '8px', color: '#34d399' }}>+5% edge</div>
                  <div style={{ height: '3px', background: 'rgba(52,211,153,0.12)', width: '90%', marginBottom: '3px', borderRadius: '1px' }}></div>
                  <div style={{ height: '3px', background: 'rgba(52,211,153,0.08)', width: '65%', borderRadius: '1px' }}></div>
                </div>
              </div>
              <div className="feature-globe"></div>
            </div>
          </div>
          <div className="feature-card-content">
            <div className="feature-card-title">Cross-platform arbitrage scanner</div>
            <div className="feature-card-icon">+</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-card-image">
            <div className="feature-illustration feature-illustration-2">
              <div className="speed-lines">
                <span className="speed-text">15<span style={{ fontSize: '18px' }}>s</span></span>
                {[180, 140, 200, 120, 160, 190, 130, 170, 150, 200, 110, 180].map((w, i) => (
                  <div key={i} className="speed-line" style={{ width: `${w}px`, opacity: 0.3 + (i * 0.05) }}></div>
                ))}
              </div>
            </div>
          </div>
          <div className="feature-card-content">
            <div className="feature-card-title">Whale trade tracker</div>
            <div className="feature-card-icon">+</div>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-card-image">
            <div className="feature-illustration feature-illustration-3">
              <div className="design-grid">
                <div className="design-line horizontal" style={{ top: '20%' }}></div>
                <div className="design-line horizontal" style={{ top: '50%' }}></div>
                <div className="design-line horizontal" style={{ top: '80%' }}></div>
                <div className="design-line vertical" style={{ left: '25%' }}></div>
                <div className="design-line vertical" style={{ left: '75%' }}></div>
                <div className="design-line diagonal" style={{ top: '10%', left: '60%' }}></div>
                <div className="design-dot" style={{ top: '20%', left: '25%' }}></div>
                <div className="design-dot" style={{ top: '50%', left: '75%' }}></div>
                <div className="design-dot" style={{ top: '80%', left: '50%' }}></div>
                <div className="design-dot" style={{ top: '20%', left: '75%' }}></div>
                <span className="design-text">AI</span>
                <div style={{ position: 'absolute', top: '45%', left: '60%', width: '20px', height: '20px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '14px' }}>+</div>
              </div>
            </div>
          </div>
          <div className="feature-card-content">
            <div className="feature-card-title">Explore 3,800+ markets</div>
            <div className="feature-card-icon">+</div>
          </div>
        </div>
      </div>
    </section>
  )
}
