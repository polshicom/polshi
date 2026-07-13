export async function sendDiscordAlert(message) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: message,
    }),
  })
}

export function formatMarketAlert(market) {
  const direction = market.polymarket > market.kalshi ? 'PM > K' : 'K > PM'
  return [
    `**${market.question}**`,
    `Polymarket: ${market.polymarket}¢ | Kalshi: ${market.kalshi}¢`,
    `Spread: ${market.difference}% (${direction})`,
    `Confidence: ${market.confidence} | Volume: ${market.volume}`,
  ].join('\n')
}
