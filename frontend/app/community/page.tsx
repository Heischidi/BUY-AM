'use client';

import Link from 'next/link';

export default function CommunityPage() {
  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(217, 83, 79, 0.12)', color: 'var(--red)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          Buy Am Family
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: 16 }}>
          Our Market Community
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Thousands of everyday shoppers, home cooks, chefs, and market traders connected by one shared heartbeat.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
        <div style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>👩🏾‍🍳</span>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Home Cooks & Foodies</h3>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
            Cooking traditional soups, jollof feasts, and daily meals with ingredients that taste like they were harvested this morning.
          </p>
        </div>

        <div style={{ padding: 20, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🏪</span>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Independent Stall Owners</h3>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
            Traders from Mile 12, Balogun, and Onitsha who have spent decades perfecting their craft now reaching verified buyers nationwide.
          </p>
        </div>

        <div style={{ padding: 20, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🌍</span>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Diaspora Care Packages</h3>
          <p style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
            Nigerians in the diaspora buying authentic, quality foodstuffs delivered directly to the doorsteps of parents and loved ones back home.
          </p>
        </div>
      </div>

      <div style={{ padding: 36, borderRadius: 24, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)', marginBottom: 48 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Become a Verified Vendor</h2>
        <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
          Do you sell quality food items, fabrics, household goods, or electronics in an open market in Nigeria? Join the Buy Am vendor network today to enjoy zero upfront registration fees, fast payouts, and automated order logistics.
        </p>
        <Link href="/contact" className="primary-button" style={{ display: 'inline-block' }}>
          Apply to Sell with Buy Am
        </Link>
      </div>
    </div>
  );
}
