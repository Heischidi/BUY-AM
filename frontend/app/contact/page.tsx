'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(217, 83, 79, 0.12)', color: 'var(--red)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          Get in Touch
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12 }}>
          Contact Buy Am
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 540, margin: '0 auto' }}>
          Have a question about an order, want to partner as a vendor, or need bargaining support? We are here for you!
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
        <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>WhatsApp Fast Support</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
            Instant chat with our customer happiness team for immediate dispatch updates.
          </p>
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#25D366', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
          >
            Chat on WhatsApp →
          </a>
        </div>

        <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📞</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Phone Line</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
            Speak directly with our support desk Monday to Saturday, 8:00 AM – 7:00 PM.
          </p>
          <a href="tel:+2348012345678" style={{ color: 'var(--red)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            +234 (0) 801 234 5678
          </a>
        </div>

        <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>✉️</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Email Support</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
            For corporate inquiries, vendor partnerships, or detailed transaction queries.
          </p>
          <a href="mailto:support@buyam.com" style={{ color: 'var(--red)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            support@buyam.com
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: 32, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Send Us a Message</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
          Fill the form below and we will respond within 2 hours during business hours.
        </p>

        {submitted ? (
          <div style={{ padding: 24, background: 'rgba(39, 174, 96, 0.1)', borderRadius: 12, textAlign: 'center', color: '#27ae60' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 6 }}>Thank You!</h3>
            <p style={{ fontSize: 14 }}>Your message don reach us. Mama Nkechi team go reply you sharp sharp!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Your Name</label>
              <input
                required
                type="text"
                className="input"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
                placeholder="e.g. Chioma Adebayo"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email Address</label>
              <input
                required
                type="email"
                className="input"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone Number (Optional)</label>
              <input
                type="tel"
                className="input"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>How can we help?</label>
              <textarea
                required
                rows={4}
                className="input"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit' }}
                placeholder="Type your message here..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button type="submit" className="primary-button" style={{ marginTop: 8 }}>
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
