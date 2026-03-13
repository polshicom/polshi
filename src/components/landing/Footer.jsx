import { PolshiLogoFooter } from '../icons/PolshiLogo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content" style={{ gridTemplateColumns: '1.5fr repeat(4, 1fr)' }}>
        <div className="footer-logo">
          <PolshiLogoFooter />
          <p style={{ fontSize: 13, color: 'var(--color-text-quaternary)', marginTop: 8, lineHeight: 1.5 }}>
            Prediction market intelligence
          </p>
        </div>
        <div className="footer-column">
          <h4>Product</h4>
          <a href="/arbitrage">Scanner</a>
          <a href="/explore">Markets</a>
          <a href="/whales">Whale Tracking</a>
          <a href="/hub">Hub</a>
        </div>
        <div className="footer-column">
          <h4>Resources</h4>
          <a href="/pricing">Pricing</a>
          <a href="/volume">Volume Dashboard</a>
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
