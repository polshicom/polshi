import Stripe from 'stripe'

let stripe = null

export function getStripe() {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripe
}
