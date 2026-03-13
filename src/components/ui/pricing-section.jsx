"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Sparkles as SparklesComp } from "@/components/ui/sparkles"
import { TimelineContent } from "@/components/ui/timeline-animation"
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { motion } from "motion/react"
import { useRef, useState } from "react"

const plans = [
  {
    name: "Free",
    description: "Get started — no credit card needed",
    price: 0,
    yearlyPrice: 0,
    buttonText: "Start free",
    buttonVariant: "outline",
    buttonHref: "/signup",
    includes: [
      "Free includes:",
      "5 arbitrage opportunities",
      "15-minute delayed prices",
      "AI-powered match verification",
      "Community match voting",
    ],
  },
  {
    name: "Pro",
    description: "Full scanner + live whale feeds",
    price: 19,
    yearlyPrice: 180,
    buttonText: "Go Pro",
    buttonVariant: "default",
    popular: true,
    includes: [
      "Everything in Free, plus:",
      "Every arbitrage opportunity",
      "15-second live prices",
      "Full access to 3,800+ markets",
      "Whale trade feed",
      "Watchlists with alerts",
      "Discord notifications",
    ],
  },
  {
    name: "Sports",
    description: "Sportsbook arbitrage + everything in Pro",
    price: 30,
    yearlyPrice: 300,
    buttonText: "Coming Soon",
    buttonVariant: "outline",
    comingSoon: true,
    includes: [
      "Everything in Pro, plus:",
      "FanDuel sportsbook arbs",
      "DraftKings integration",
      "BetMGM integration",
      "Caesars Sportsbook integration",
      "Sports arb scanner",
    ],
  },
]

function PricingSwitch({ onSwitch }) {
  const [selected, setSelected] = useState("0")

  const handleSwitch = (value) => {
    setSelected(value)
    onSwitch(value)
  }

  return (
    <div className="flex justify-center pt-4">
      <div className="relative z-10 mx-auto flex w-fit rounded-full bg-neutral-900 border border-neutral-700 p-1.5">
        <button
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 h-12 rounded-full px-8 py-2 text-base font-medium transition-colors",
            selected === "0" ? "text-white" : "text-gray-400",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId="switch"
              className="absolute inset-0 rounded-full border-2 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 h-12 rounded-full px-8 py-2 text-base font-medium transition-colors",
            selected === "1" ? "text-white" : "text-gray-400",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId="switch"
              className="absolute inset-0 rounded-full border-2 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Yearly</span>
        </button>
      </div>
    </div>
  )
}

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const pricingRef = useRef(null)

  const revealVariants = {
    visible: (i) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  }

  const togglePricingPeriod = (value) =>
    setIsYearly(Number.parseInt(value) === 1)

  return (
    <div
      className="min-h-screen mx-auto relative bg-black overflow-x-hidden"
      ref={pricingRef}
    >
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0 h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]"
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px]"></div>
        <SparklesComp
          density={1800}
          speed={1}
          color="#FFFFFF"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>
      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute left-0 top-[-114px] w-full h-[113.625vh] flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0"
      >
        <div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
          ></div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
          ></div>
        </div>
      </TimelineContent>

      <article className="text-center mb-10 pt-32 max-w-3xl mx-auto space-y-4 relative z-50">
        <h2 className="text-4xl md:text-5xl font-medium text-white">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            One arb pays for the month
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-gray-400 text-lg"
        >
          Free tier gets you started. Pro unlocks the full scanner, live whale
          feeds, and every market on both platforms.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
        >
          <PricingSwitch onSwitch={togglePricingPeriod} />
        </TimelineContent>
      </article>

      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, #206ce8 0%, transparent 70%)",
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />

      <div className="grid md:grid-cols-3 max-w-5xl gap-6 py-6 mx-auto px-6">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card
              className={cn(
                "relative text-white border-neutral-700/60",
                plan.popular
                  ? "bg-gradient-to-b from-neutral-800/80 via-neutral-900 to-neutral-900 shadow-[0px_0px_80px_-20px_rgba(59,130,246,0.5)] z-20"
                  : "bg-gradient-to-b from-neutral-800/60 via-neutral-900 to-neutral-900 z-10"
              )}
            >
              <CardHeader className="text-left p-8 pb-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-medium">{plan.name}</h3>
                  {plan.comingSoon && (
                    <span className="text-xs font-medium bg-neutral-700 text-gray-300 px-3 py-1 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <div className="flex items-baseline mt-4">
                  <span className="text-5xl font-semibold">
                    $
                    <NumberFlow
                      value={isYearly ? plan.yearlyPrice : plan.price}
                      className="text-5xl font-semibold"
                    />
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-400 ml-2 text-lg">
                      /{isYearly ? "year" : "month"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="p-8 pt-6">
                <button
                  className={cn(
                    "w-full py-4 text-lg font-medium rounded-xl mt-2 mb-2",
                    plan.popular
                      ? "bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg shadow-blue-900/40 border border-blue-500 text-white"
                      : "bg-gradient-to-t from-neutral-900 to-neutral-700 shadow-lg shadow-neutral-900/50 border border-neutral-700 text-white"
                  )}
                  disabled={plan.comingSoon}
                >
                  {plan.buttonText}
                </button>

                <div className="space-y-3 pt-6 mt-6 border-t border-neutral-700/60">
                  <h4 className="font-medium text-sm mb-4">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-3">
                    {plan.includes.slice(1).map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <span className="h-2 w-2 bg-neutral-500 rounded-full flex-shrink-0"></span>
                        <span className="text-sm text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>
    </div>
  )
}
