'use client';

import { useState, FormEvent } from 'react';
import { procurementApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ProcurementModalProps {
  onClose: () => void;
}

export default function ProcurementModal({ onClose }: ProcurementModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    item_description: '',
    quantity: 1,
    budget: '',
    delivery_location: '',
    required_date: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await procurementApi.submit(
        {
          ...form,
          budget: form.budget ? Number(form.budget) : undefined,
          quantity: Number(form.quantity),
        },
        token || undefined
      );
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h3 style={{ color: 'var(--green)', marginBottom: 12 }}>Request submitted!</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
              We&apos;ll review your procurement request and get back to you soon.
            </p>
            <button className="primary-button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <h3>📦 Need procurement?</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 24, marginTop: 6 }}>
              Tell us what you need and we&apos;ll source it for you.
            </p>

            {error && (
              <div style={{ padding: '12px', borderRadius: 12, background: '#fee', color: 'var(--red)', marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>What do you need? *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the item(s) you need..."
                  value={form.item_description}
                  onChange={e => setForm(f => ({ ...f, item_description: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label>Budget (₦)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Delivery location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagos Island, Abuja FCT"
                  value={form.delivery_location}
                  onChange={e => setForm(f => ({ ...f, delivery_location: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Required by (date)</label>
                <input
                  type="date"
                  value={form.required_date}
                  onChange={e => setForm(f => ({ ...f, required_date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Additional notes</label>
                <textarea
                  rows={2}
                  placeholder="Any special requirements..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="primary-button" disabled={loading} style={{ flex: 1 }}>
                  {loading ? <span className="spinner" /> : 'Submit request'}
                </button>
                <button type="button" onClick={onClose} className="secondary-button">
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
