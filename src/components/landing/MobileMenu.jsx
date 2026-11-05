'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MobileMenu({ isLoggedIn }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="header-hamburger"
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/></svg>
        )}
      </button>
      {open && (
        <nav className="header-mobile-dropdown" onClick={() => setOpen(false)}>
          <Link href="/explore" className="header-mobile-link">Markets</Link>
          <Link href="/arbitrage" className="header-mobile-link">Scanner</Link>
          <Link href="/whales" className="header-mobile-link">Whales</Link>
          <Link href="/hub" className="header-mobile-link">Hub</Link>
          <Link href="/pricing" className="header-mobile-link">Pricing</Link>
          {!isLoggedIn && <Link href="/login" className="header-mobile-link">Log in</Link>}
          {isLoggedIn && <Link href="/settings" className="header-mobile-link">Settings</Link>}
        </nav>
      )}
    </>
  )
}
