'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShootingStars } from '../ui/shooting-stars'
import { Particles } from '../ui/particles'

const POPULAR_TAGS = [
  'Bitcoin', 'Trump', 'Fed Rates', 'NBA', 'Ethereum',
  'World Cup', 'Election', 'Stanley Cup', 'Crypto', 'AI'
]

export default function SearchHero() {
  const [query, setQuery] = useState('')
  const [isDark, setIsDark] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const root = document.documentElement
    const update = () => setIsDark(root.getAttribute('data-theme') === 'dark')
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleTagClick(tag) {
    router.push(`/explore?q=${encodeURIComponent(tag)}`)
  }

  return (
    <section className={`search-hero ${isDark ? 'search-hero-dark' : 'search-hero-light'}`}>
      {isDark ? (
        <>
          {/* Dark mode: starfield + shooting stars */}
          <div className="search-hero-starfield">
            <div className="search-hero-stars" />
            <div className="search-hero-radial" />
          </div>
          <ShootingStars
            starColor="#6366f1"
            trailColor="#818cf8"
            minSpeed={15}
            maxSpeed={35}
            minDelay={1000}
            maxDelay={3000}
          />
          <ShootingStars
            starColor="#8b5cf6"
            trailColor="#c4b5fd"
            minSpeed={10}
            maxSpeed={25}
            minDelay={2000}
            maxDelay={4000}
          />
          <ShootingStars
            starColor="#3b82f6"
            trailColor="#93c5fd"
            minSpeed={20}
            maxSpeed={40}
            minDelay={1500}
            maxDelay={3500}
          />
        </>
      ) : (
        /* Light mode: particles */
        <Particles
          className="absolute inset-0"
          quantity={120}
          ease={80}
          size={0.4}
          color="#000000"
          staticity={50}
        />
      )}

      <div className="search-hero-content">
        <div className="search-hero-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="12" r="7" fill={isDark ? '#818cf8' : '#6366f1'} opacity="0.6" />
            <circle cx="15" cy="12" r="7" fill={isDark ? '#fff' : '#0f172a'} opacity="0.8" />
          </svg>
        </div>
        <h1 className="search-hero-title">The Prediction Market Terminal</h1>
        <p className="search-hero-subtitle">
          Find arbitrage between Polymarket and Kalshi. Track whale trades. Spot edges before they close.
        </p>

        <form className="search-hero-form" onSubmit={handleSubmit}>
          <div className="search-hero-input-wrap">
            <svg className="search-hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="search-hero-input"
              placeholder="Search any market... (e.g., bitcoin, trump, fed rates)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="search-hero-tags">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              className="search-hero-tag"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="search-hero-trust">
          Tracking $3.6B+ in prediction market volume across both platforms
        </div>
      </div>
    </section>
  )
}
