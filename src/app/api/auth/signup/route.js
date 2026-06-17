import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { getSupabaseAdmin } from '../../../../lib/supabase'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check for existing user
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const password_hash = await hash(password, 12)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        emailVerified: null,
      })
      .select('id, name, email')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
