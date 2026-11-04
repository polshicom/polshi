'use client'

import { useState } from 'react'

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
          <a href="/explore" className="header-mobile-link">Markets</a>
          <a href="/arbitrage" className="header-mobile-link">Scanner</a>
          <a href="/whales" className="header-mobile-link">Whales</a>
          <a href="/hub" className="header-mobile-link">Hub</a>
          <a href="/pricing" className="header-mobile-link">Pricing</a>
          {!isLoggedIn && <a href="/login" className="header-mobile-link">Log in</a>}
          {isLoggedIn && <a href="/settings" className="header-mobile-link">Settings</a>}
        </nav>
      )}
    </>
  )
}
