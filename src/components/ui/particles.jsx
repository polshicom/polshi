"use client"

import { cn } from "../../lib/utils"
import React, { useEffect, useRef, useState } from "react"

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return mousePosition
}

const Particles = ({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
  logos = false,
  blur = 0,
  excludeSelectors = [],
}) => {
  const canvasRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const context = useRef(null)
  const circles = useRef([])
  const mousePosition = useMousePosition()
  const mouse = useRef({ x: 0, y: 0 })
  const canvasSize = useRef({ w: 0, h: 0 })
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1
  const animationFrameRef = useRef(null)
  const imagesRef = useRef([])
  const imagesLoadedRef = useRef(false)
  const exclusionZonesRef = useRef([])

  // Compute exclusion zones from DOM selectors
  const updateExclusionZones = () => {
    if (!canvasContainerRef.current || !logos || excludeSelectors.length === 0) {
      exclusionZonesRef.current = []
      return
    }
    const canvasRect = canvasContainerRef.current.getBoundingClientRect()
    const padding = 20 // extra padding around text
    const zones = []
    for (const selector of excludeSelectors) {
      const els = document.querySelectorAll(selector)
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        zones.push({
          x1: r.left - canvasRect.left - padding,
          y1: r.top - canvasRect.top - padding,
          x2: r.right - canvasRect.left + padding,
          y2: r.bottom - canvasRect.top + padding,
        })
      })
    }
    exclusionZonesRef.current = zones
  }

  const isInExclusionZone = (x, y) => {
    for (const z of exclusionZonesRef.current) {
      if (x >= z.x1 && x <= z.x2 && y >= z.y1 && y <= z.y2) return true
    }
    return false
  }

  // Load logo images when logos mode is enabled
  useEffect(() => {
    if (!logos) {
      imagesLoadedRef.current = true
      return
    }

    const polymarketImg = new Image()
    const kalshiImg = new Image()
    let loaded = 0

    const onLoad = () => {
      loaded++
      if (loaded === 2) {
        imagesRef.current = [
          { img: polymarketImg, aspect: polymarketImg.naturalWidth / polymarketImg.naturalHeight },
          { img: kalshiImg, aspect: kalshiImg.naturalWidth / kalshiImg.naturalHeight },
        ]
        imagesLoadedRef.current = true
        initCanvas()
      }
    }

    polymarketImg.onload = onLoad
    kalshiImg.onload = onLoad
    polymarketImg.src = "/polymarket-logo.png"
    kalshiImg.src = "/kalshi-logo.webp"
  }, [logos])

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d")
    }
    if (!logos || imagesLoadedRef.current) {
      initCanvas()
    }
    const runAnimation = () => {
      clearContext()
      circles.current.forEach((circle, i) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.current.h - circle.y - circle.translateY - circle.size,
        ]
        const closestEdge = edge.reduce((a, b) => Math.min(a, b))
        const remapClosestEdge = parseFloat(
          remapValue(closestEdge, 0, 20, 0, 1).toFixed(2),
        )
        if (remapClosestEdge > 1) {
          circle.alpha += 0.005
          if (circle.alpha > circle.targetAlpha) {
            circle.alpha = circle.targetAlpha
          }
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge
        }
        // Repel from nearby logos to prevent overlap
        if (logos) {
          for (let j = 0; j < circles.current.length; j++) {
            if (i === j) continue
            const other = circles.current[j]
            const ddx = (circle.x + circle.translateX) - (other.x + other.translateX)
            const ddy = (circle.y + circle.translateY) - (other.y + other.translateY)
            const dist = Math.sqrt(ddx * ddx + ddy * ddy)
            if (dist < MIN_SPACING && dist > 0) {
              const force = (MIN_SPACING - dist) / MIN_SPACING * 0.15
              circle.x += (ddx / dist) * force
              circle.y += (ddy / dist) * force
            }
          }

          // Push out of exclusion zones
          const cx = circle.x + circle.translateX
          const cy = circle.y + circle.translateY
          for (const z of exclusionZonesRef.current) {
            if (cx >= z.x1 && cx <= z.x2 && cy >= z.y1 && cy <= z.y2) {
              // Find nearest edge and push toward it
              const distLeft = cx - z.x1
              const distRight = z.x2 - cx
              const distTop = cy - z.y1
              const distBottom = z.y2 - cy
              const minDist = Math.min(distLeft, distRight, distTop, distBottom)
              if (minDist === distLeft) circle.x -= 0.5
              else if (minDist === distRight) circle.x += 0.5
              else if (minDist === distTop) circle.y -= 0.5
              else circle.y += 0.5
            }
          }
        }
        circle.x += circle.dx + vx
        circle.y += circle.dy + vy
        circle.translateX +=
          (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
          ease
        circle.translateY +=
          (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
          ease

        drawCircle(circle, true)

        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.current.h + circle.size
        ) {
          circles.current.splice(i, 1)
          const newCircle = circleParams()
          drawCircle(newCircle)
        }
      })
      animationFrameRef.current = window.requestAnimationFrame(runAnimation)
    }
    animationFrameRef.current = window.requestAnimationFrame(runAnimation)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [color])

  const handleResize = () => {
    updateExclusionZones()
    initCanvas()
  }

  useEffect(() => {
    onMouseMove()
  }, [mousePosition.x, mousePosition.y])

  useEffect(() => {
    initCanvas()
  }, [refresh])

  const initCanvas = () => {
    resizeCanvas()
    updateExclusionZones()
    drawParticles()
  }

  const onMouseMove = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const { w, h } = canvasSize.current
      const x = mousePosition.x - rect.left - w / 2
      const y = mousePosition.y - rect.top - h / 2
      const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2
      if (inside) {
        mouse.current.x = x
        mouse.current.y = y
      }
    }
  }

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0
      canvasSize.current.w = canvasContainerRef.current.offsetWidth
      canvasSize.current.h = canvasContainerRef.current.offsetHeight
      canvasRef.current.width = canvasSize.current.w * dpr
      canvasRef.current.height = canvasSize.current.h * dpr
      canvasRef.current.style.width = `${canvasSize.current.w}px`
      canvasRef.current.style.height = `${canvasSize.current.h}px`
      context.current.scale(dpr, dpr)
    }
  }

  const MIN_SPACING = 50

  const overlapsExisting = (x, y) => {
    for (const c of circles.current) {
      const dx = c.x - x
      const dy = c.y - y
      if (Math.sqrt(dx * dx + dy * dy) < MIN_SPACING) return true
    }
    return false
  }

  const circleParams = () => {
    let x, y
    let attempts = 0
    do {
      x = Math.floor(Math.random() * canvasSize.current.w)
      y = Math.floor(Math.random() * canvasSize.current.h)
      attempts++
    } while (logos && (overlapsExisting(x, y) || isInExclusionZone(x, y)) && attempts < 80)

    const translateX = 0
    const translateY = 0
    const pSize = logos
      ? Math.floor(Math.random() * 8) + 10 // smaller: 10-18px
      : Math.floor(Math.random() * 2) + size
    const alpha = 0
    const targetAlpha = logos
      ? parseFloat((Math.random() * 0.55 + 0.20).toFixed(2)) // 20-75% opacity
      : parseFloat((Math.random() * 0.6 + 0.1).toFixed(1))
    const dx = logos
      ? (Math.random() - 0.5) * 0.025
      : (Math.random() - 0.5) * 0.1
    const dy = logos
      ? (Math.random() - 0.5) * 0.025
      : (Math.random() - 0.5) * 0.1
    const magnetism = logos
      ? 0.3 + Math.random() * 3 // stronger mouse tracking
      : 0.1 + Math.random() * 4
    const logoType = Math.random() < 0.5 ? 0 : 1
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
      logoType,
    }
  }

  const rgb = hexToRgb(color)

  const drawCircle = (circle, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size: circleSize, alpha, logoType } = circle

      if (logos && imagesLoadedRef.current && imagesRef.current.length === 2) {
        const imgData = imagesRef.current[logoType]
        const img = imgData.img
        const aspect = imgData.aspect

        const drawHeight = circleSize * 2
        const drawWidth = drawHeight * aspect
        const cornerRadius = 4

        context.current.save()
        context.current.translate(translateX, translateY)
        context.current.globalAlpha = alpha

        context.current.beginPath()
        context.current.roundRect(
          x - drawWidth / 2,
          y - drawHeight / 2,
          drawWidth,
          drawHeight,
          cornerRadius,
        )
        context.current.clip()

        context.current.drawImage(
          img,
          x - drawWidth / 2,
          y - drawHeight / 2,
          drawWidth,
          drawHeight,
        )

        context.current.restore()
        context.current.setTransform(dpr, 0, 0, dpr, 0, 0)
      } else {
        context.current.translate(translateX, translateY)
        context.current.beginPath()
        context.current.arc(x, y, circleSize, 0, 2 * Math.PI)
        context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`
        context.current.fill()
        context.current.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      if (!update) {
        circles.current.push(circle)
      }
    }
  }

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      )
    }
  }

  const drawParticles = () => {
    clearContext()
    const particleCount = quantity
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams()
      drawCircle(circle)
    }
  }

  const remapValue = (value, start1, end1, start2, end2) => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2
    return remapped > 0 ? remapped : 0
  }

  return (
    <div
      className={cn("pointer-events-none", className)}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="size-full"
        style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined}
      />
    </div>
  )
}

function hexToRgb(hex) {
  hex = hex.replace("#", "")

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("")
  }

  const hexInt = parseInt(hex, 16)
  const red = (hexInt >> 16) & 255
  const green = (hexInt >> 8) & 255
  const blue = hexInt & 255
  return [red, green, blue]
}

export { Particles }
