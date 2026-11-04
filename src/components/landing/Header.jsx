import { auth } from '../../lib/auth'
import { PolshiLogo } from '../icons/PolshiLogo'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'

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
          <a href="/settings" className="header-avatar">
            {user.image ? (
              <img src={user.image} alt={user.name || 'User'} />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </a>
        ) : (
          <>
            <a href="/login" className="header-login">Log in</a>
            <a href="/signup" className="header-signup">Sign in</a>
          </>
        )}
        <MobileMenu isLoggedIn={!!user} />
      </div>
    </header>
  )
}
