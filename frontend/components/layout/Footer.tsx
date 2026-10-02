import Logo from './Logo';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo inverted />
            <p className="footer-slogan">Buy it at Buy Am.</p>
          </div>

          <div>
            <h3>Marketplace</h3>
            <Link href="/#categories">Categories</Link>
            <Link href="/#products">Featured products</Link>
            <Link href="/seller">Become a seller</Link>
          </div>

          <div>
            <h3>Support</h3>
            <Link href="/help">Help centre</Link>
            <Link href="/delivery">Delivery information</Link>
            <Link href="/contact">Contact us</Link>
          </div>

          <div>
            <h3>Company</h3>
            <Link href="/about">About Buy Am</Link>
            <Link href="/community">Our community</Link>
            <Link href="/terms">Terms and privacy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} Buy Am. Nigeria&apos;s marketplace.
        </div>
      </div>
    </footer>
  );
}
