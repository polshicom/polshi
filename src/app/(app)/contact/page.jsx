'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address'
    if (!form.subject.trim()) e.subject = 'Subject is required'
    if (!form.message.trim()) e.message = 'Message is required'
    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    // Simulate submission
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
          <CardDescription>
            Have a question or feedback? We&apos;d love to hear from you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${errors.name ? 'border-destructive' : 'border-input'} bg-background`}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${errors.email ? 'border-destructive' : 'border-input'} bg-background`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="subject" className="text-sm font-medium">Subject</label>
              <input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="What's this about?"
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${errors.subject ? 'border-destructive' : 'border-input'} bg-background`}
              />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us more..."
                rows={5}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none ${errors.message ? 'border-destructive' : 'border-input'} bg-background`}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={submitted} onOpenChange={setSubmitted}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message sent!</DialogTitle>
            <DialogDescription>
              Thanks for reaching out. We&apos;ll get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSubmitted(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
