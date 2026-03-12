'use client'

import React, { useState } from 'react'
import { Button } from './button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip'
import { cn } from '../../lib/utils'
import { CheckCircle, Star } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const frequencies = ['monthly', 'yearly']

export function PricingSection({
  plans,
  heading,
  description,
  className,
  ...props
}) {
  const [frequency, setFrequency] = useState('monthly')

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center space-y-5 p-4',
        className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
          {heading}
        </h2>
        {description && (
          <p className="text-muted-foreground text-center text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      <PricingFrequencyToggle
        frequency={frequency}
        setFrequency={setFrequency}
      />
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard plan={plan} key={plan.name} frequency={frequency} />
        ))}
      </div>
    </div>
  )
}

export function PricingFrequencyToggle({
  frequency,
  setFrequency,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'mx-auto flex w-fit rounded-full border border-border p-1',
        className,
      )}
      style={{ background: 'var(--color-bg-secondary)' }}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className="relative px-4 py-1 text-sm capitalize"
        >
          <span className="relative z-10">{freq}</span>
          {frequency === freq && (
            <motion.span
              layoutId="frequency"
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-foreground absolute inset-0 z-0 rounded-full mix-blend-difference"
            />
          )}
        </button>
      ))}
    </div>
  )
}

export function PricingCard({
  plan,
  className,
  frequency = 'monthly',
  ...props
}) {
  return (
    <div
      key={plan.name}
      className={cn(
        'relative flex w-full flex-col rounded-lg border border-border',
        plan.comingSoon && 'opacity-80',
        className,
      )}
      {...props}
    >
      {plan.highlighted && (
        <BorderTrail
          style={{
            boxShadow:
              '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
          }}
          size={100}
        />
      )}
      <div
        className={cn(
          'rounded-t-lg border-b border-border p-4',
          plan.highlighted ? 'bg-muted/40' : 'bg-muted/20',
        )}
      >
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {plan.comingSoon && (
            <p className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-semibold"
               style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-tertiary)' }}>
              Coming Soon
            </p>
          )}
          {plan.highlighted && (
            <p className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs"
               style={{ background: 'var(--color-bg-primary)' }}>
              <Star className="h-3 w-3 fill-current" />
              Popular
            </p>
          )}
          {frequency === 'yearly' && plan.price.yearly > 0 && (
            <p className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
              {Math.round(
                ((plan.price.monthly * 12 - plan.price.yearly) /
                  plan.price.monthly /
                  12) *
                  100,
              )}
              % off
            </p>
          )}
        </div>

        <div className="text-lg font-medium">{plan.name}</div>
        <p className="text-muted-foreground text-sm font-normal">{plan.info}</p>
        <h3 className="mt-2 flex items-end gap-1">
          <span className="text-3xl font-bold">
            ${frequency === 'yearly' && plan.price.yearly > 0
              ? Math.round(plan.price.yearly / 12)
              : plan.price.monthly}
          </span>
          <span className="text-muted-foreground">
            {plan.price.monthly > 0
              ? '/' + (frequency === 'monthly' ? 'month' : 'month')
              : ''}
          </span>
        </h3>
        {frequency === 'yearly' && plan.price.yearly > 0 && (
          <p className="text-muted-foreground mt-1 text-xs">
            ${plan.price.yearly}/year
          </p>
        )}
      </div>
      <div
        className={cn(
          'text-muted-foreground space-y-4 px-4 py-6 text-sm flex-1',
          plan.highlighted && 'bg-muted/10',
        )}
      >
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-primary)' }} />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <p
                    className={cn(
                      feature.tooltip &&
                        'cursor-pointer border-b border-dashed border-border',
                    )}
                  >
                    {feature.text}
                  </p>
                </TooltipTrigger>
                {feature.tooltip && (
                  <TooltipContent>
                    <p>{feature.tooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
      <div
        className={cn(
          'mt-auto w-full border-t border-border p-3',
          plan.highlighted && 'bg-muted/40',
        )}
      >
        {plan.comingSoon ? (
          <Button className="w-full" variant="outline" disabled>
            Coming Soon
          </Button>
        ) : plan.btn.onClick ? (
          <Button
            className="w-full"
            variant={plan.highlighted ? 'default' : 'outline'}
            onClick={plan.btn.onClick}
          >
            {plan.btn.text}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={plan.highlighted ? 'default' : 'outline'}
            asChild
          >
            <Link href={plan.btn.href}>{plan.btn.text}</Link>
          </Button>
        )}
      </div>
    </div>
  )
}

function BorderTrail({
  className,
  size = 60,
  transition,
  delay,
  onAnimationComplete,
  style,
}) {
  const BASE_TRANSITION = {
    repeat: Infinity,
    duration: 5,
    ease: 'linear',
  }

  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className={cn('absolute aspect-square bg-zinc-500', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          ...style,
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          ...(transition ?? BASE_TRANSITION),
          delay: delay,
        }}
        onAnimationComplete={onAnimationComplete}
      />
    </div>
  )
}

export { BorderTrail }
