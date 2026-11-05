import { NextResponse } from 'next/server'
import { hasGoogle } from '../../../../lib/auth'

export async function GET() {
  return NextResponse.json({ google: hasGoogle })
}
