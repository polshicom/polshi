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
      <div className="mx-auto max-w-xl space-y-3">
        <h2
          className="text-center font-bold tracking-tight"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}
        >
          {heading}
        </h2>
        {description && (
          <p className="text-center" style={{ fontSize: 15, color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
            {description}
          </p>
        )}
      </div>
      <PricingFrequencyToggle
        frequency={frequency}
        setFrequency={setFrequency}
      />
      <div className="mx-auto grid w-full grid-cols-1 gap-4 md:grid-cols-3" style={{ maxWidth: 960 }}>
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
      className={cn('mx-auto flex w-fit rounded-full p-1', className)}
      style={{
        background: 'var(--color-bg-tertiary)',
        border: '0.5px solid var(--glass-border)',
      }}
      {...props}
    >
      {frequencies.map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className="relative px-5 py-1.5 text-sm capitalize"
          style={{
            borderRadius: 9999,
            fontWeight: frequency === freq ? 600 : 400,
            color: frequency === freq ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            background: frequency === freq ? 'var(--color-bg-primary)' : 'transparent',
            boxShadow: frequency === freq ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {freq}
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
      className={cn('relative flex w-full flex-col rounded-2xl', className)}
      style={{
        background: 'var(--glass-bg)',
        border: plan.highlighted ? '1.5px solid var(--color-brand-bg)' : '0.5px solid var(--glass-border)',
        opacity: plan.comingSoon ? 0.7 : 1,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-elevated)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      {...props}
    >
      {/* Header */}
      <div
        className="rounded-t-2xl p-5"
        style={{ borderBottom: '0.5px solid var(--glass-border)' }}
      >
        <div className="flex items-start justify-between mb-1">
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {plan.name}
          </div>
          <div className="flex items-center gap-2">
            {plan.comingSoon && (
              <span
                className="rounded-md px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)', border: '0.5px solid var(--glass-border)' }}
              >
                Coming Soon
              </span>
            )}
            {plan.highlighted && (
              <span
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                style={{ background: 'rgba(94, 106, 210, 0.12)', color: 'var(--color-brand-bg)' }}
              >
                <Star className="h-3 w-3 fill-current" />
                Popular
              </span>
            )}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
          {plan.info}
        </p>
        <div className="flex items-end gap-1">
          <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            ${frequency === 'yearly' && plan.price.yearly > 0
              ? Math.round(plan.price.yearly / 12)
              : plan.price.monthly}
          </span>
          <span style={{ fontSize: 14, color: 'var(--color-text-quaternary)', paddingBottom: 2 }}>
            {plan.price.monthly > 0 ? '/month' : ''}
          </span>
        </div>
        {frequency === 'yearly' && plan.price.yearly > 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-text-quaternary)', marginTop: 4 }}>
            ${plan.price.yearly}/year
            <span style={{ color: '#10b981', marginLeft: 8, fontWeight: 600 }}>
              Save {Math.round(((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100)}%
            </span>
          </p>
        )}
      </div>

      {/* Features */}
      <div className="space-y-3 px-5 py-5 flex-1" style={{ fontSize: 14 }}>
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <CheckCircle
              className="h-4 w-4 shrink-0"
              style={{ color: plan.highlighted ? '#10b981' : 'var(--color-text-quaternary)' }}
            />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <p
                    style={{ color: 'var(--color-text-secondary)' }}
                    className={cn(
                      feature.tooltip && 'cursor-pointer border-b border-dashed',
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

      {/* CTA */}
      <div className="mt-auto w-full p-4" style={{ borderTop: '0.5px solid var(--glass-border)' }}>
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
