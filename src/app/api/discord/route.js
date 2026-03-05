import { NextResponse } from 'next/server'
import { sendDiscordAlert, formatMarketAlert } from '../../../lib/discord'

export async function POST(request) {
  try {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return NextResponse.json(
        { error: 'Discord webhook not configured' },
        { status: 500 }
      )
    }

    const { message, market } = await request.json()

    const text = market
      ? formatMarketAlert(market)
      : message || 'Test alert from Polshi'

    await sendDiscordAlert(text)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send Discord alert' },
      { status: 500 }
    )
  }
}
