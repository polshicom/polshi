import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, WHALE_YESTERDAY_KEY } from '../../../lib/scanner-worker'

export async function GET() {
  ensureWorkerRunning()

  let cached = cacheGetWithMeta(WHALE_YESTERDAY_KEY)
  if (!cached.timestamp) {
    await waitForFirstCycle()
    cached = cacheGetWithMeta(WHALE_YESTERDAY_KEY)
  }

  const whale = cached.value ?? null
  const lastUpdated = cached.timestamp ? new Date(cached.timestamp).toISOString() : null

  return NextResponse.json({
    whale,
    meta: { lastUpdated },
  })
}
