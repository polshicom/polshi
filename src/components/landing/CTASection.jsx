import Link from 'next/link'
export default function CTASection() {
  return (
    <section className="cta-section">
      <h2 className="cta-heading">Start comparing prediction markets today.</h2>
      <div className="cta-actions">
        <a href="#pricing" className="btn-secondary">View pricing</Link>
        <Link href="/signup" className="btn-white">Start for free</Link>
      </div>
    </section>
  )
}
