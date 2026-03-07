import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import { compare } from 'bcryptjs'
import { getSupabaseAdmin } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: supabaseUrl
    ? SupabaseAdapter({ url: supabaseUrl, secret: supabaseServiceKey })
    : undefined,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/dashboard',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const supabase = getSupabaseAdmin()
        const { data: user, error } = await supabase
          .from('users')
          .select('id, name, email, image, password_hash')
          .eq('email', credentials.email)
          .single()

        if (error || !user || !user.password_hash) return null

        const isValid = await compare(credentials.password, user.password_hash)
        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      // Query subscription status (skip if Supabase not configured)
      if (supabaseUrl) {
        try {
          const supabase = getSupabaseAdmin()
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .eq('user_id', token.id || token.sub)
            .eq('status', 'active')
            .single()

          token.plan = sub?.plan || 'free'
          token.isPro = token.plan === 'pro'
        } catch {
          token.plan = token.plan || 'free'
          token.isPro = token.plan === 'pro'
        }
      } else {
        token.plan = token.plan || 'free'
        token.isPro = token.plan === 'pro'
      }

      return token
    },
    async session({ session, token }) {
      session.user.id = token.id || token.sub
      session.user.plan = token.plan
      session.user.isPro = token.isPro
      return session
    },
  },
})
