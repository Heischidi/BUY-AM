import Link from 'next/link';

interface LogoProps {
  inverted?: boolean; // cream color for footer
}

export default function Logo({ inverted = false }: LogoProps) {
  return (
    <Link
      className="logo"
      href="/"
      aria-label="Buy Am home"
      style={{ color: inverted ? 'var(--cream)' : undefined }}
    >
      <span className="logo-cart" />
      <span className="logo-word">
        <span>buy</span>
        <span>am</span>
      </span>
      <span className="accent-flecks" aria-hidden="true">
        <i /><i /><i />
      </span>
    </Link>
  );
}
