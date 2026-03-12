import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, TOP_ARB_KEY } from '../../../lib/scanner-worker'

export async function GET() {
  ensureWorkerRunning()
  await waitForFirstCycle()

  const cached = cacheGetWithMeta(TOP_ARB_KEY)
  const topArb = cached.value ?? null
  const lastUpdated = cached.timestamp ? new Date(cached.timestamp).toISOString() : null

  return NextResponse.json({
    topArb,
    meta: { lastUpdated },
  })
}
