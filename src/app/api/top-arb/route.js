import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, TOP_ARB_KEY } from '../../../lib/scanner-worker'

export async function GET() {
  // Ensure background worker is running (no-op if already started)
  ensureWorkerRunning()

  // If cache is empty (cold start), wait for the first worker cycle
  let cached = cacheGetWithMeta(TOP_ARB_KEY)
  if (!cached.timestamp) {
    await waitForFirstCycle()
    cached = cacheGetWithMeta(TOP_ARB_KEY)
  }

  const topArb = cached.value ?? null
  const lastUpdated = cached.timestamp ? new Date(cached.timestamp).toISOString() : null

  return NextResponse.json({
    topArb,
    meta: { lastUpdated },
  })
}
