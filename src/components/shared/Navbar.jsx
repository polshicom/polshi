'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PolshiLogo } from '../icons/PolshiLogo'
import ThemeToggle from '../landing/ThemeToggle'

function GlassFilter() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <filter
        id="glass-distortion"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.001 0.005"
          numOctaves="1"
          seed="17"
          result="turbulence"
        />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale="5"
          specularConstant="1"
          specularExponent="100"
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="litImage"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="200"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}

export default function Navbar({ user }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <GlassFilter />
      <header className="glass-navbar">
        <div className="glass-layer glass-blur" />
        <div className="glass-layer glass-tint" />
        <div className="glass-layer glass-shine" />

        <div className="glass-navbar-inner">
          <Link href="/" className="navbar-logo">
            <PolshiLogo />
            Polshi
          </Link>

          <nav className="navbar-nav glass-nav-pills">
            <Link href="/explore" className="glass-pill">Markets</Link>
            <Link href="/whales" className="glass-pill">Whales</Link>
            <Link href="/arbitrage" className="glass-pill">Scanner</Link>
            <Link href="/faq" className="glass-pill">Learn</Link>
            <Link href="/pricing" className="glass-pill">Pricing</Link>
            <Link href="/hub" className="glass-pill">Hub</Link>
          </nav>

          <div className="navbar-actions">
            <ThemeToggle />
            {user ? (
              <div className="navbar-user">
                <Link href="/settings" className="navbar-avatar">
                  {user.image ? (
                    <img src={user.image} alt={user.name || 'User'} />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="navbar-login">Log in</Link>
                <Link href="/signup" className="glass-signup">Sign in</Link>
              </>
            )}
            <button
              className="navbar-hamburger"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <nav className="mobile-nav-dropdown" onClick={() => setMobileOpen(false)}>
          <Link href="/explore" className="mobile-nav-link">Markets</Link>
          <Link href="/arbitrage" className="mobile-nav-link">Scanner</Link>
          <Link href="/whales" className="mobile-nav-link">Whales</Link>
          <Link href="/hub" className="mobile-nav-link">Hub</Link>
          <Link href="/faq" className="mobile-nav-link">Learn</Link>
          <Link href="/pricing" className="mobile-nav-link">Pricing</Link>
          {!user && <Link href="/login" className="mobile-nav-link">Log in</Link>}
          {user && <Link href="/settings" className="mobile-nav-link">Settings</Link>}
        </nav>
      )}
    </>
  )
}
