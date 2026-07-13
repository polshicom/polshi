'use client'

import { PricingSection as PricingCards } from '../ui/pricing'

async function handleCheckout(plan) {
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  } catch {}
}

const PLANS = [
  {
    name: 'Free',
    info: 'Get started — no credit card needed',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      { text: '5 arbitrage opportunities' },
      { text: '15-minute delayed prices' },
      { text: 'AI-powered match verification', tooltip: 'Our AI verifies that matched markets across platforms are actually the same event' },
      { text: 'Community match voting', tooltip: 'Help verify matches and earn community reputation' },
    ],
    btn: {
      text: 'Start free',
      href: '/signup',
    },
  },
  {
    highlighted: true,
    name: 'Pro',
    info: 'Full scanner + live whale feeds',
    price: {
      monthly: 19,
      yearly: 180,
    },
    features: [
      { text: 'Every arbitrage opportunity' },
      { text: '15-second live prices', tooltip: 'Real-time price data sourced directly from each platform\'s API' },
      { text: 'Full access to 3,800+ markets' },
      { text: 'Whale trade feed', tooltip: 'Monitor large trades across both platforms with whale scores and repeat-buyer detection' },
      { text: 'Watchlists with alerts' },
      { text: 'Discord notifications', tooltip: 'Get pinged in Discord when new high-edge arbs appear' },
    ],
    btn: {
      text: 'Go Pro',
      href: '#',
    },
  },
  {
    comingSoon: true,
    name: 'Sports',
    info: 'Sportsbook arbitrage + everything in Pro',
    price: {
      monthly: 30,
      yearly: 300,
    },
    features: [
      { text: 'Everything in Pro' },
      { text: 'FanDuel sportsbook arbs', tooltip: 'Scan FanDuel lines against prediction markets for cross-platform arbitrage' },
      { text: 'DraftKings integration' },
      { text: 'BetMGM integration' },
      { text: 'Caesars Sportsbook integration' },
      { text: 'Sports arb scanner', tooltip: 'Dedicated scanner that finds mispriced lines across sportsbooks and prediction markets' },
    ],
    btn: {
      text: 'Coming Soon',
      href: '#',
    },
  },
]

export default function PricingSection() {
  // Attach checkout handler to the Pro plan button
  const plans = PLANS.map(plan => {
    if (plan.name === 'Pro') {
      return {
        ...plan,
        btn: {
          ...plan.btn,
          onClick: () => handleCheckout('monthly'),
        },
      }
    }
    return plan
  })

  return (
    <section className="pricing-section" id="pricing">
      <PricingCards
        plans={plans}
        heading="One arb pays for the month"
        description="Free tier gets you started. Pro unlocks the full scanner, live whale feeds, and every market on both platforms."
      />
    </section>
  )
}
