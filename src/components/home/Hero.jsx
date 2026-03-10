export default function Hero() {
  return (
    <section className="hero-simple">
      <div className="hero-simple-content">
        <h1 className="hero-simple-title">The Prediction Market Terminal</h1>
        <p className="hero-simple-subtitle">
          Find arbitrage between Polymarket and Kalshi. Track whale trades. Spot edges before they close.
        </p>
        <div className="hero-simple-actions">
          <a href="/explore" className="btn-primary">Explore Markets</a>
          <a href="/arbitrage" className="hero-simple-link">
            Open Scanner
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
