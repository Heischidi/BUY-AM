'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(217, 83, 79, 0.12)', color: 'var(--red)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          Our Story
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
          Buy It at Buy Am.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
          Reimagining Nigeria&apos;s vibrant open markets for the digital age — with authentic goods, real vendors, and live bargaining.
        </p>
      </div>

      <div style={{ padding: 36, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)', marginBottom: 48 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Why Buy Am Was Born</h2>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
          In every Nigerian market — from Balogun and Tejuosho in Lagos to Main Market in Onitsha and Bodija in Ibadan — shopping is never just a transaction. It is an experience: warmth, conversation, tasting the freshness, bantering over price, and leaving with a smile and a little <em>&quot;jara&quot;</em> in your bag.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
          Modern e-commerce stripped that soul away, replacing lively interaction with cold, rigid price tags. <strong>Buy Am</strong> brings the culture back. We empower traditional traders with digital storefronts, verify quality at the source, and let customers bargain in authentic Nigerian style.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
        <div style={{ padding: 28, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💃🏾</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Mama Nkechi AI</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Our custom AI shopping matriarch who speaks natural Pidgin, knows market prices, recommends fresh seasonal produce, and negotiates fairly within real trader boundaries.
          </p>
        </div>

        <div style={{ padding: 28, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Trader Empowerment</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            We provide local open-market vendors with reliable procurement, logistics, and instant payments, helping them reach buyers far beyond their physical stalls.
          </p>
        </div>

        <div style={{ padding: 28, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Buyer Protection</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
            Every Naira is secured in escrow until your package arrives and matches your order. What you see is exactly what you get.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: 36, background: 'var(--card-bg, #fdfbf7)', borderRadius: 24, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Ready to experience market life?</h2>
        <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 24 }}>
          Browse our categories or test your pricing skills with Mama Nkechi today!
        </p>
        <Link href="/" className="primary-button" style={{ display: 'inline-block' }}>
          Explore the Market
        </Link>
      </div>
    </div>
  );
}
