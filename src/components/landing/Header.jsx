import Link from 'next/link'
import { auth } from '../../lib/auth'
import { PolshiLogo } from '../icons/PolshiLogo'
import ThemeToggle from './ThemeToggle'
import MobileMenu from './MobileMenu'

export default async function Header() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="header">
      <Link href="/" className="header-logo">
        <PolshiLogo />
        Polshi
      </Link>
      <nav className="header-nav">
        <Link href="/explore">Markets</Link>
        <Link href="/hub">Hub</Link>
        <Link href="/whales">Whales</Link>
        <Link href="/arbitrage">Scanner</Link>
        <Link href="/pricing">Pricing</Link>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {user ? (
          <Link href="/settings" className="header-avatar">
            {user.image ? (
              <img src={user.image} alt={user.name || 'User'} />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </Link>
        ) : (
          <>
            <Link href="/login" className="header-login">Log in</Link>
            <Link href="/signup" className="header-signup">Sign in</Link>
          </>
        )}
        <MobileMenu isLoggedIn={!!user} />
      </div>
    </header>
  )
}
