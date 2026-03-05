import { NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { getSupabaseAdmin } from '../../../lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isPro) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('watchlists')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 })
  }

  return NextResponse.json({ watchlist: data })
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.isPro) {
    return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })
  }

  const { market_question, alert_threshold } = await request.json()

  if (!market_question) {
    return NextResponse.json({ error: 'market_question is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('watchlists')
    .insert({
      user_id: session.user.id,
      market_question,
      alert_threshold: alert_threshold || 5,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 })
  }

  return NextResponse.json({ item: data }, { status: 201 })
}

export async function DELETE(request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
