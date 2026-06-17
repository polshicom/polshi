const FREE_ITEMS = [
  { ok: true,  text: 'See 5 open price gaps' },
  { ok: true,  text: 'Updates every 15 minutes' },
  { ok: false, text: 'Alerts when gaps appear' },
  { ok: false, text: 'Live whale trade feed' },
  { ok: false, text: 'Custom watchlists' },
  { ok: false, text: 'Discord alerts' },
]

const PRO_ITEMS = [
  { text: 'See every open price gap' },
  { text: 'Updates every 30 seconds' },
  { text: 'Get alerted when gaps appear' },
  { text: 'Live whale trade feed' },
  { text: 'Custom watchlists' },
  { text: 'Discord alerts' },
]

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function PricingCTA() {
  return (
    <section className="hp-pricing-section">
      <div className="hp-section-wrap">
        <div className="hp-pricing-head">
          <h2 className="hp-pricing-headline">Stop missing trades.</h2>
          <p className="hp-pricing-sub">Free shows you the surface. Pro shows you everything.</p>
        </div>

        <div className="hp-pricing-grid">
          <div className="hp-pricing-card hp-pricing-free">
            <div className="hp-pricing-card-head">
              <span className="hp-pricing-tier">Free</span>
              <span className="hp-pricing-price">$0</span>
            </div>
            <ul className="hp-pricing-list">
              {FREE_ITEMS.map(item => (
                <li key={item.text} className={`hp-pricing-item ${item.ok ? 'hp-pricing-item-ok' : 'hp-pricing-item-no'}`}>
                  <span className="hp-pricing-item-icon">{item.ok ? <CheckIcon /> : <XIcon />}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <a href="/signup" className="hp-cta-ghost hp-pricing-btn">Start Free</a>
          </div>

          <div className="hp-pricing-card hp-pricing-pro">
            <div className="hp-pricing-pro-glow" aria-hidden="true" />
            <div className="hp-pricing-card-head">
              <span className="hp-pricing-tier">Pro</span>
              <div className="hp-pricing-price-wrap">
                <span className="hp-pricing-price">$29</span>
                <span className="hp-pricing-per">/mo</span>
              </div>
            </div>
            <ul className="hp-pricing-list">
              {PRO_ITEMS.map(item => (
                <li key={item.text} className="hp-pricing-item hp-pricing-item-ok hp-pricing-item-pro">
                  <span className="hp-pricing-item-icon"><CheckIcon /></span>
                  {item.text}
                </li>
              ))}
            </ul>
            <a href="/pricing" className="hp-cta-primary hp-pricing-btn">Get Pro →</a>
          </div>
        </div>

        <p className="hp-pricing-urgency">
          Price gaps close fast. Free updates every 15 minutes. By then, the trade may be gone.
        </p>
      </div>
    </section>
  )
}
