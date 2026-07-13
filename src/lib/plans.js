export const PLANS = {
  free: {
    name: 'Free',
    maxMarkets: 5,
    refreshInterval: 900, // 15 minutes in seconds
    features: {
      watchlist: false,
      discordAlerts: false,
      priceHistory: false,
      csvExport: false,
    },
  },
  pro: {
    name: 'Pro',
    maxMarkets: Infinity,
    refreshInterval: 15, // 15 seconds
    features: {
      watchlist: true,
      discordAlerts: true,
      priceHistory: true,
      csvExport: true,
    },
  },
}

export function getPlan(planName) {
  return PLANS[planName] || PLANS.free
}

export function isPro(planName) {
  return planName === 'pro'
}
