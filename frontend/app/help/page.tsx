'use client';

import Link from 'next/link';
import { useState } from 'react';

const FAQS = [
  {
    q: 'How does "Price Am" & bargaining with Mama Nkechi work?',
    a: 'Any item with the "Price Am" tag allows you to bargain! Click "Price Am" on any product card or open the chat assistant. Mama Nkechi will banter and negotiate with you in authentic Nigerian Pidgin. If your offer falls within the vendor\'s acceptable range, she\'ll seal the deal and add it to your cart at your agreed price!',
  },
  {
    q: 'How do I pay on Buy Am?',
    a: 'We support all major Nigerian payment methods via Paystack: Debit/Credit cards (Mastercard, Visa, Verve), Direct Bank Transfer, and USSD. All payments are held safely until your goods are verified.',
  },
  {
    q: 'How does delivery work and how fast is it?',
    a: 'Orders in Lagos and major commercial hubs offer same-day and next-day delivery. Interstate deliveries take 2–4 business days via our vetted logistics partners. You receive SMS & tracking updates from dispatch to doorstep.',
  },
  {
    q: 'Are the fresh food items and market goods authentic?',
    a: 'Yes! Our food items, fabrics, and produce come directly from registered traders across Lagos and Onitsha open markets. Fresh items like catfish, tomatoes, and vegetables are sourced fresh every morning.',
  },
  {
    q: 'What is your return & refund policy?',
    a: 'If your fresh produce arrives damaged or an item does not match its description, report it within 24 hours of delivery. We will issue a replacement or full refund to your original payment method immediately.',
  },
];

export default function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(217, 83, 79, 0.12)', color: 'var(--red)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          Help & Support Centre
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
          Wetin you need help with?
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
          Find fast answers to your shopping questions, delivery updates, and bargaining guide.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🛍️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Shopping & Pricing</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
            Learn how to negotiate with Mama Nkechi, add to cart, and claim discount deals.
          </p>
        </div>
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🚚</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Delivery & Tracking</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
            Check shipping timelines, pickup hubs, and live package status updates.
          </p>
          <Link href="/delivery" style={{ display: 'inline-block', marginTop: 10, color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>
            View delivery info →
          </Link>
        </div>
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>💳</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Payments & Refunds</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
            Secure Paystack checkout, refund timelines, and transaction support.
          </p>
          <Link href="/contact" style={{ display: 'inline-block', marginTop: 10, color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>
            Contact support →
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--card-bg, #fff)',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: 20, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 20px', color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 32, borderRadius: 20, background: 'var(--card-bg, #fdfbf7)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Still need help?</h3>
        <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 20 }}>
          Our customer happiness team is available Monday to Saturday, 8am – 7pm.
        </p>
        <Link href="/contact" className="primary-button" style={{ display: 'inline-block' }}>
          Contact our team
        </Link>
      </div>
    </div>
  );
}
