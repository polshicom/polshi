import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, STATS_KEY } from '../../../lib/scanner-worker'

export async function GET() {
  ensureWorkerRunning()

  const cached = cacheGetWithMeta(STATS_KEY)
  const stats = cached.value || { scanned: 0, arbCount: 0, totalEdge: 0 }

  return NextResponse.json({
    ...stats,
    lastUpdated: cached.timestamp ? new Date(cached.timestamp).toISOString() : null,
  })
}
