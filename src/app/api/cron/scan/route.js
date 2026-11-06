import { NextResponse } from 'next/server'
import { triggerScan } from '../../../../lib/scanner-worker'

// Give Vercel's serverless function a real execution budget — full
// market coverage (fetch + match + verify) takes longer than the
// platform default. 60s fits comfortably within Hobby and Pro limits;
// raise it if your plan allows and cycles start running close to it.
export const maxDuration = 60

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
