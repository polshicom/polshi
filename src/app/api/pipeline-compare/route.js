import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, COMPARE_KEY } from '../../../lib/scanner-worker'

export async function GET() {
  ensureWorkerRunning()

  const cached = await cacheGetWithMeta(COMPARE_KEY)
  const report = cached.value

  if (!report) {
    return NextResponse.json({
      status: 'waiting',
      message: 'No comparison data yet — the first A/B cycle runs after the scanner completes its initial fetch. Check back in ~60 seconds.',
    })
  }

  return NextResponse.json(report)
}
