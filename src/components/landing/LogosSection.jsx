export default function LogosSection() {
  return (
    <section className="logos-section">
      <p className="logos-heading">
        One dashboard for every prediction market.<br />
        Live prices from Polymarket and Kalshi, compared across every category.
      </p>
      <div className="logos-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="logo-item">
          <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>Polymarket</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>Kalshi</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Politics</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Economics</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Crypto</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Technology</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Sports</span>
        </div>
        <div className="logo-item">
          <span style={{ fontSize: '24px', fontWeight: 600 }}>Climate</span>
        </div>
      </div>
    </section>
  )
}
