'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'What is prediction market arbitrage?',
    a: 'Prediction markets let you buy YES or NO shares on an outcome, each priced between $0 and $1. When the same event is listed on both Polymarket and Kalshi, the prices sometimes differ. If you buy YES on one platform and NO on the other, and your total cost is under $1.00, you\u2019re guaranteed a profit \u2014 because no matter what happens, one of your positions pays out $1. For example: YES costs 52\u00a2 on Polymarket and NO costs 44\u00a2 on Kalshi. Your total cost is 96\u00a2. Regardless of the outcome, you receive $1 back \u2014 a guaranteed 4\u00a2 profit per share.',
  },
  {
    q: 'How does Polshi find arbitrage?',
    a: 'We scan Polymarket and Kalshi in real time, match equivalent markets using AI-powered text analysis, and calculate the price spread. When we find a mismatch, we show you exactly where to buy on each platform.',
  },
  {
    q: 'How often are prices updated?',
    a: 'Pro subscribers get 15-second updates sourced directly from each platform\'s API. Free tier data refreshes every 15 minutes.',
  },
  {
    q: 'What is whale tracking?',
    a: 'Whale tracking monitors large trades across both platforms in real time. Each trade gets a whale score based on its size relative to typical activity. Repeat whales (same wallet, multiple large trades) are flagged so you can follow smart money.',
  },
  {
    q: 'Is this financial advice?',
    a: 'No. Polshi is an informational tool that displays publicly available price data. Nothing on this site constitutes financial, investment, or trading advice. Always do your own research.',
  },
  {
    q: 'How do I cancel my Pro subscription?',
    a: 'You can cancel anytime from your account settings. Your Pro access continues until the end of your current billing period.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="faq-section">
      <h2 className="faq-heading">Frequently asked questions</h2>
      <div className="faq-list">
        {FAQS.map((faq, i) => (
          <div key={i} className={`faq-item ${openIndex === i ? 'open' : ''}`}>
            <button
              className="faq-question"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              {faq.q}
              <span className="faq-icon">+</span>
            </button>
            <div className="faq-answer">
              <p>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
