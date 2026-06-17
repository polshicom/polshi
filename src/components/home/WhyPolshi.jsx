const CARDS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 16V4m0 0L3 8m4-4 4 4" />
        <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </svg>
    ),
    accentCls: 'hp-why-icon--indigo',
    title: 'Find price gaps',
    desc: 'See where Polymarket and Kalshi disagree. Take the better price.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    accentCls: 'hp-why-icon--green',
    title: "See who's buying big",
    desc: 'Track the largest trades happening right now. Follow the money.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="9" height="18" rx="2" />
        <rect x="13" y="3" width="9" height="18" rx="2" />
      </svg>
    ),
    accentCls: 'hp-why-icon--blue',
    title: 'Compare any market',
    desc: 'Same event, two platforms, side by side. Spot the difference fast.',
  },
]

export default function WhyPolshi() {
  return (
    <section className="hp-why-section">
      <div className="hp-section-wrap">
        <div className="hp-why-grid">
          {CARDS.map(card => (
            <div key={card.title} className="hp-why-card">
              <div className={`hp-why-icon ${card.accentCls}`}>{card.icon}</div>
              <h3 className="hp-why-title">{card.title}</h3>
              <p className="hp-why-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
