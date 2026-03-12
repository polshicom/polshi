import { auth } from '../../lib/auth'
import { PolshiLogo } from '../icons/PolshiLogo'
import ThemeToggle from './ThemeToggle'

export default async function Header() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="header">
      <a href="/" className="header-logo">
        <PolshiLogo />
        Polshi
      </a>
      <nav className="header-nav">
        <a href="/explore">Markets</a>
        <a href="/hub">Hub</a>
        <a href="/whales">Whales</a>
        <a href="/arbitrage">Scanner</a>
        <a href="/pricing">Pricing</a>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {user ? (
          <a href="/settings" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, overflow: 'hidden', textDecoration: 'none' }}>
              {user.image ? (
                <img src={user.image} alt={user.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name?.charAt(0)?.toUpperCase() || '?'
              )}
            </a>
        ) : (
          <>
            <a href="/login" className="header-login">Log in</a>
            <a href="/signup" className="header-signup" style={{ textDecoration: 'none' }}>Sign in</a>
          </>
        )}
      </div>
    </header>
  )
}
