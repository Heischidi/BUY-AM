'use client';

import Link from 'next/link';

export default function DeliveryPage() {
  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(217, 83, 79, 0.12)', color: 'var(--red)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          Logistics & Shipping
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
          Fast & Reliable Delivery Across Nigeria
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          From bustling markets to your doorstep. We partner with top local dispatchers to ensure your goods arrive fresh and on time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
        <div style={{ padding: 28, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Lagos Metro Delivery</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Same-day delivery available for orders placed before 11:00 AM. Next-day delivery for all evening orders across Mainland and Island.
          </p>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            ⏱️ 4 – 24 Hours
          </div>
        </div>

        <div style={{ padding: 28, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Major Cities (Abuja, PH, Ibadan)</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Direct interstate logistics lines to Abuja, Port Harcourt, Ibadan, Enugu, Asaba, and Kano with package tracking and SMS alerts.
          </p>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            ⏱️ 1 – 3 Business Days
          </div>
        </div>

        <div style={{ padding: 28, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Fresh Food Preservation</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            Perishable food items (catfish, vegetables, fresh peppers) are packaged in ventilated food-grade containers and handled with priority speed.
          </p>
          <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            🥦 Priority Cold Pack
          </div>
        </div>
      </div>

      <div style={{ padding: 32, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)', marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Delivery FAQs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>
          <div>
            <strong style={{ color: 'inherit', display: 'block', marginBottom: 4 }}>Can I change my delivery address after placing an order?</strong>
            Yes, if your order is not yet marked "Out for Delivery". Reach out to support immediately via WhatsApp or phone.
          </div>
          <div>
            <strong style={{ color: 'inherit', display: 'block', marginBottom: 4 }}>Do you offer Cash on Delivery (COD)?</strong>
            To protect our market traders and ensure reliable fulfillment, all orders are prepaid securely via Paystack with 100% buyer protection escrow.
          </div>
          <div>
            <strong style={{ color: 'inherit', display: 'block', marginBottom: 4 }}>What happens if I miss the rider's call?</strong>
            Our dispatch riders attempt delivery twice and will contact your backup phone number. Packages can also be held at our nearest local pickup hub.
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/" className="primary-button" style={{ display: 'inline-block' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
