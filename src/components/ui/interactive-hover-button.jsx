'use client'

import React from "react"
import { ArrowRight } from "lucide-react"

const InteractiveHoverButton = React.forwardRef(
  ({ text = "Button", href, className = "", ...props }, ref) => {
    const Tag = href ? 'a' : 'button'
    const linkProps = href ? { href } : {}

    return (
      <Tag
        ref={ref}
        className={`ihb-root ${className}`}
        {...linkProps}
        {...props}
      >
        <span className="ihb-label">{text}</span>
        <div className="ihb-hover-content">
          <span>{text}</span>
          <ArrowRight size={18} />
        </div>
        <div className="ihb-bg" />
      </Tag>
    )
  }
)

InteractiveHoverButton.displayName = "InteractiveHoverButton"

export { InteractiveHoverButton }
