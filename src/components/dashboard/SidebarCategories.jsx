'use client'

import { useState } from 'react'

const CATEGORIES = [
  'US Politics',
  'World Politics',
  'Crypto',
  'Economics',
  'Tech & AI',
  'Sports',
  'Science & Space',
  'Climate',
  'Entertainment',
  'Business',
]

export default function SidebarCategories() {
  const [active, setActive] = useState('all')

  function handleClick(cat) {
    const next = cat === active ? 'all' : cat
    setActive(next)
    window.dispatchEvent(new CustomEvent('polshi:category', { detail: next }))
  }

  return (
    <nav className="sidebar-nav">
      <button
        className={`sidebar-link sidebar-cat-btn ${active === 'all' ? 'active' : ''}`}
        onClick={() => handleClick('all')}
      >
        All
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          className={`sidebar-link sidebar-cat-btn ${active === cat ? 'active' : ''}`}
          onClick={() => handleClick(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  )
}
