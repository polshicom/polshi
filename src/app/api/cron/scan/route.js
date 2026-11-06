import { NextResponse } from 'next/server'
import { triggerScan } from '../../../../lib/scanner-worker'

// Give Vercel's serverless function a real execution budget — full
// market coverage (fetch + match + verify) takes longer than the
// platform default. Kalshi's maxPages went 30→130 (its real event
// count is ~22,700, not ~13,600) and the matcher scores a full cross
// product, so total pairs scored roughly doubles again on top of the
// earlier category-bucketing removal. 280s leaves slim but real
// margin under Pro's 300s hard cap.
export const maxDuration = 280

// Scans must be driven by an awaited request with its own execution
// budget — not by a fire-and-forget call inside a page-load API route,
// which Vercel can freeze/kill right after the response is sent before
// the fetch/match/cache work finishes. Wire this up to either:
//   1. Vercel Cron (vercel.json) — only runs frequently on paid plans, or
//   2. A free external scheduler (cron-job.org, GitHub Actions, etc.)
// hitting this URL every 1-2 minutes with the CRON_SECRET below.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = searchParams.get('secret') || request.headers.get('authorization')?.replace('Bearer ', '')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await triggerScan()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
