import { PolshiLogoFooter } from '../icons/PolshiLogo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <PolshiLogoFooter />
        </div>
        <div className="footer-column">
          <h4>Product</h4>
          <a href="/arbitrage">Scanner</a>
          <a href="/explore">Markets</a>
          <a href="/whales">Whale Tracking</a>
          <a href="/volume">Volume Dashboard</a>
          <a href="/hub">Dashboards</a>
        </div>
        <div className="footer-column">
          <h4>Pricing</h4>
          <a href="/pricing">Free tier</a>
          <a href="/pricing">Pro plan</a>
          <a href="/pricing">FAQ</a>
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
