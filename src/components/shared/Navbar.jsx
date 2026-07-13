'use client'

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
  return (
    <>
      <GlassFilter />
      <header className="glass-navbar">
        {/* Glass layers */}
        <div className="glass-layer glass-blur" />
        <div className="glass-layer glass-tint" />
        <div className="glass-layer glass-shine" />

        {/* Content */}
        <div className="glass-navbar-inner">
          <a href="/" className="navbar-logo">
            <PolshiLogo />
            Polshi
          </a>

          <nav className="navbar-nav glass-nav-pills">
            <a href="/explore" className="glass-pill">Markets</a>
            <a href="/whales" className="glass-pill">Whales</a>
            <a href="/arbitrage" className="glass-pill">Scanner</a>
            <a href="/pricing" className="glass-pill">Pricing</a>
            <a href="/hub" className="glass-pill">Hub</a>
          </nav>

          <div className="navbar-actions">
            <ThemeToggle />
            {user ? (
              <div className="navbar-user">
                <a href="/settings" className="navbar-avatar">
                  {user.image ? (
                    <img src={user.image} alt={user.name || 'User'} />
                  ) : (
                    user.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </a>
              </div>
            ) : (
              <>
                <a href="/login" className="navbar-login">Log in</a>
                <a href="/signup" className="glass-signup">Sign in</a>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
