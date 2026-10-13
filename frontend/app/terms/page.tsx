'use client';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 880, margin: '40px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ marginBottom: 40 }}>
        <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 999, background: 'rgba(217, 83, 79, 0.12)', color: 'var(--red)', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
          Legal & Trust
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 800, marginBottom: 12 }}>
          Terms of Service & Privacy Policy
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>
          Last updated: October 2026 • Buy Am Nigeria (buyam.com)
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, fontSize: 16, lineHeight: 1.8, color: 'var(--foreground)' }}>
        <section style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>1. Acceptance of Terms</h2>
          <p style={{ color: 'var(--muted)' }}>
            By using Buy Am, registering an account, purchasing items, or interacting with our automated bargaining assistant (Mama Nkechi), you agree to these Terms and Conditions in full. If you disagree with any part, please discontinue use of the platform.
          </p>
        </section>

        <section style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>2. Price Am & Bargaining Rules</h2>
          <p style={{ color: 'var(--muted)' }}>
            The &quot;Price Am&quot; feature allows buyers to make offers on negotiable goods. When an offer is accepted by Mama Nkechi within the vendor&apos;s floor and ceiling price boundaries, the resulting agreed price is legally binding once payment is completed. Fictitious or automated bot offers may result in account suspension.
          </p>
        </section>

        <section style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>3. Payments & Escrow Protection</h2>
          <p style={{ color: 'var(--muted)' }}>
            All payments are processed securely through licensed payment switch Paystack. Buy Am operates an escrow system: funds are held safely and only disbursed to vendors after delivery confirmation. Card details and banking credentials are never stored on Buy Am servers.
          </p>
        </section>

        <section style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>4. Return, Replacement & Refund Policy</h2>
          <p style={{ color: 'var(--muted)' }}>
            Customers have 24 hours from delivery to inspect fresh produce, groceries, and perishables, and 7 days for non-perishable goods (clothing, household items, electronics). If an item is damaged, defective, or materially distinct from its description, Buy Am will facilitate a replacement or full refund.
          </p>
        </section>

        <section style={{ padding: 28, borderRadius: 20, border: '1px solid var(--border)', background: 'var(--card-bg, #fff)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>5. Privacy Statement & Data Use</h2>
          <p style={{ color: 'var(--muted)' }}>
            We only collect necessary personal data (name, email, delivery address, phone number) to process and deliver your orders. We do not sell your data to third parties. Communications through the chat assistant may be processed to fulfill your customer request and improve shopping recommendations.
          </p>
        </section>
      </div>
    </div>
  );
}
