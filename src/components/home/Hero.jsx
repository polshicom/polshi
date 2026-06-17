export default function Hero() {
  return (
    <section className="hp-hero">
      <div className="hp-hero-inner">
        <div className="hp-live-pill">
          <span className="hp-live-dot" />
          Live · Scanning now
        </div>
        <h1 className="hp-hero-heading">
          Find the better price.<br />Take the trade.
        </h1>
        <p className="hp-hero-body">
          Polymarket and Kalshi price the same events differently.
          Polshi shows you where, how much profit is available,
          and which side to take — updated every 30 seconds.
        </p>
        <div className="hp-hero-ctas">
          <a href="/signup" className="hp-cta-primary">Start Free</a>
          <a href="/arbitrage" className="hp-cta-ghost">
            View Live Scanner
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
