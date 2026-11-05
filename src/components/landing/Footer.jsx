import Link from 'next/link'
import { PolshiLogoFooter } from '../icons/PolshiLogo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <PolshiLogoFooter />
          <p style={{ fontSize: 13, color: 'var(--color-text-quaternary)', marginTop: 8, lineHeight: 1.5 }}>
            Prediction market intelligence
          </p>
        </div>
        <div className="footer-column">
          <h4>Product</h4>
          <Link href="/arbitrage">Scanner</Link>
          <Link href="/explore">Markets</Link>
          <Link href="/whales">Whale Tracking</Link>
          <Link href="/hub">Hub</Link>
        </div>
        <div className="footer-column">
          <h4>Resources</h4>
          <Link href="/pricing">Pricing</Link>
          <Link href="/volume">Volume Dashboard</Link>
        </div>
        <div className="footer-column">
          <h4>Legal</h4>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
        <div className="footer-column">
          <h4>Connect</h4>
          <a href="#">X (Twitter)</a>
          <a href="#">Discord</a>
        </div>
      </div>
    </footer>
  )
}
