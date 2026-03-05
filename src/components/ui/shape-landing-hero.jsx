"use client"

import { motion } from "framer-motion"
import { Circle } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "../../lib/utils"
import { InteractiveHoverButton } from "./interactive-hover-button"

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  lightGradient = "from-black/[0.06]",
  isLight = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 4,
          delay: delay + 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            isLight ? lightGradient : gradient,
            "backdrop-blur-[2px] border-2",
            isLight ? "border-black/[0.06]" : "border-white/[0.08]",
            isLight
              ? "shadow-[0_8px_32px_0_rgba(0,0,0,0.04)]"
              : "shadow-[0_8px_32px_0_rgba(255,255,255,0.05)]",
            "after:absolute after:inset-0 after:rounded-full",
            isLight
              ? "after:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.06),transparent_70%)]"
              : "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  )
}

function HeroGeometric({
  badge = "Polshi",
  title1 = "Find Arbitrage",
  title2 = "Across Prediction Markets",
}) {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    function check() {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--hero-bg)' }}
    >
      <div className={cn(
        "absolute inset-0 blur-3xl",
        isLight
          ? "bg-gradient-to-br from-black/[0.01] via-transparent to-black/[0.01]"
          : "bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02]"
      )} />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-white/[0.06]"
          lightGradient="from-black/[0.04]"
          isLight={isLight}
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-white/[0.08]"
          lightGradient="from-black/[0.05]"
          isLight={isLight}
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-white/[0.05]"
          lightGradient="from-black/[0.03]"
          isLight={isLight}
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-white/[0.07]"
          lightGradient="from-black/[0.04]"
          isLight={isLight}
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-white/[0.04]"
          lightGradient="from-black/[0.03]"
          isLight={isLight}
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 md:mb-12",
              isLight
                ? "bg-black/[0.03] border border-black/[0.08]"
                : "bg-white/[0.03] border border-white/[0.08]"
            )}
          >
            <Circle className={cn("h-2 w-2", isLight ? "fill-black/40" : "fill-white/60")} />
            <span className={cn("text-sm tracking-wide", isLight ? "text-black/50" : "text-white/60")}>
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
              <span className={cn(
                "bg-clip-text text-transparent bg-gradient-to-b",
                isLight ? "from-black to-black/80" : "from-white to-white/80"
              )}>
                {title1}
              </span>
              <br />
              <span className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r",
                isLight ? "from-black/50 via-black to-black/50" : "from-white/50 via-white to-white/50"
              )}>
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className={cn(
              "text-base sm:text-lg md:text-xl mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4",
              isLight ? "text-black/40" : "text-white/40"
            )}>
              Compare Polymarket and Kalshi prices in real time.
              Spot mispricings and lock in guaranteed profit.
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <InteractiveHoverButton
              text="Try it now — free"
              href="/dashboard"
              className={isLight ? 'ihb-light' : ''}
            />
          </motion.div>
        </div>
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(to top, var(--hero-bg) 0%, transparent 40%, color-mix(in srgb, var(--hero-bg) 80%, transparent) 100%)'
            : 'linear-gradient(to top, var(--hero-bg) 0%, transparent 40%, color-mix(in srgb, var(--hero-bg) 80%, transparent) 100%)'
        }}
      />
    </div>
  )
}

export { HeroGeometric }
