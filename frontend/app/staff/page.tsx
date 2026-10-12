'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { staffApi } from '@/lib/api';

interface StaffMember {
  id: number;
  name: string;
  email: string;
}

interface ClockStatus {
  staff_name: string;
  is_clocked_in: boolean;
  clock_in: string | null;
  clock_out: string | null;
  today: string;
}

type PageMode = 'select' | 'action' | 'result';
type ActionType = 'clock-in' | 'clock-out';

export default function StaffClockInPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<PageMode>('select');

  // Selected staff
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // PIN input
  const [pin, setPin] = useState('');
  const [actionType, setActionType] = useState<ActionType>('clock-in');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    message: string;
    clock_in?: string;
    clock_out?: string;
    hours_worked?: number;
    hours_display?: string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    staffApi.listPublic()
      .then((data) => setStaffList(data as StaffMember[]))
      .catch(() => setStaffList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectStaff = async (staff: StaffMember) => {
    setSelectedStaff(staff);
    setCheckingStatus(true);
    setError(null);
    setPin('');
    try {
      const status = await staffApi.checkStatus(staff.email) as ClockStatus;
      setClockStatus(status);
      setActionType(status.is_clocked_in ? 'clock-out' : 'clock-in');
    } catch {
      setClockStatus(null);
      setActionType('clock-in');
    } finally {
      setCheckingStatus(false);
      setMode('action');
    }
  };

  const handlePinDigit = (digit: string, idx: number) => {
    if (digit.length > 1) return;
    const newPin = pin.substring(0, idx) + digit + pin.substring(idx + 1);
    setPin(newPin);
    if (digit && idx < 3) {
      pinRefs.current[idx + 1]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace') {
      if (pin[idx]) {
        const newPin = pin.substring(0, idx) + '' + pin.substring(idx + 1);
        setPin(newPin);
      } else if (idx > 0) {
        pinRefs.current[idx - 1]?.focus();
        const newPin = pin.substring(0, idx - 1) + '' + pin.substring(idx);
        setPin(newPin);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedStaff || pin.length < 4) return;
    setSubmitting(true);
    setError(null);
    try {
      let res: any;
      if (actionType === 'clock-in') {
        res = await staffApi.clockIn(selectedStaff.email, pin);
      } else {
        res = await staffApi.clockOut(selectedStaff.email, pin);
      }
      setResult(res);
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMode('select');
    setSelectedStaff(null);
    setClockStatus(null);
    setPin('');
    setError(null);
    setResult(null);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="staff-clock-page">
      {/* Background gradient */}
      <div className="staff-clock-bg" />

      <div className="staff-clock-container">
        {/* Header */}
        <div className="staff-clock-header">
          <Link href="/" className="staff-back-link">← Buy Am</Link>
          <div className="staff-clock-brand">
            <span className="staff-brand-icon">🏪</span>
            <span className="staff-brand-name">Buy Am</span>
          </div>
          <Link href="/admin" className="staff-back-link" style={{ opacity: 0.5 }}>Admin</Link>
        </div>

        {/* Clock Display */}
        <div className="staff-digital-clock">
          <div className="staff-time-display">
            {currentTime.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className="staff-date-display">
            {currentTime.toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Main Card */}
        <div className="staff-clock-card">
          {/* ── Mode: Select Staff ── */}
          {mode === 'select' && (
            <div className="staff-select-mode">
              <div className="staff-card-title">
                <span style={{ fontSize: 36 }}>👤</span>
                <h1 className="staff-h1">Staff Sign-In</h1>
                <p className="staff-subtitle">Select your name to clock in or out</p>
              </div>

              {loading ? (
                <div className="staff-loading">
                  <span className="staff-spinner" />
                  <span>Loading staff list…</span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="staff-empty">
                  <span style={{ fontSize: 48 }}>😔</span>
                  <p>No staff registered yet. Ask the admin to add you to the system.</p>
                </div>
              ) : (
                <div className="staff-grid">
                  {staffList.map(s => (
                    <button
                      key={s.id}
                      className="staff-member-btn"
                      onClick={() => handleSelectStaff(s)}
                    >
                      <div className="staff-avatar">
                        {s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="staff-member-name">{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Mode: PIN Entry ── */}
          {mode === 'action' && selectedStaff && (
            <div className="staff-pin-mode">
              <button className="staff-back-btn" onClick={handleReset}>← Back</button>

              <div className="staff-card-title">
                <div className="staff-avatar-lg">
                  {selectedStaff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <h2 className="staff-h2">{selectedStaff.name}</h2>

                {checkingStatus ? (
                  <span className="staff-status-badge loading">Checking status…</span>
                ) : clockStatus ? (
                  <span className={`staff-status-badge ${clockStatus.is_clocked_in ? 'clocked-in' : 'clocked-out'}`}>
                    {clockStatus.is_clocked_in
                      ? `Currently Clocked In since ${clockStatus.clock_in ? formatTime(clockStatus.clock_in) : '—'}`
                      : 'Not Clocked In Today'}
                  </span>
                ) : null}
              </div>

              <div className="staff-action-toggle">
                <button
                  className={`staff-action-btn ${actionType === 'clock-in' ? 'active-in' : ''}`}
                  onClick={() => setActionType('clock-in')}
                >
                  🟢 Clock In
                </button>
                <button
                  className={`staff-action-btn ${actionType === 'clock-out' ? 'active-out' : ''}`}
                  onClick={() => setActionType('clock-out')}
                >
                  🔴 Clock Out
                </button>
              </div>

              <div className="staff-pin-section">
                <label className="staff-pin-label">Enter your 4-digit PIN</label>
                <div className="staff-pin-inputs">
                  {[0, 1, 2, 3].map(idx => (
                    <input
                      key={idx}
                      ref={el => { pinRefs.current[idx] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      className="staff-pin-input"
                      value={pin[idx] || ''}
                      onChange={e => handlePinDigit(e.target.value, idx)}
                      onKeyDown={e => handlePinKeyDown(e, idx)}
                      onFocus={e => e.target.select()}
                    />
                  ))}
                </div>
                {error && <div className="staff-error">{error}</div>}
              </div>

              <button
                className="staff-submit-btn"
                onClick={handleSubmit}
                disabled={pin.length < 4 || submitting}
                style={{ background: actionType === 'clock-in' ? 'var(--green)' : 'var(--red)' }}
              >
                {submitting ? (
                  <><span className="btn-spinner" /> Processing…</>
                ) : actionType === 'clock-in' ? (
                  '🟢 Clock In Now'
                ) : (
                  '🔴 Clock Out Now'
                )}
              </button>
            </div>
          )}

          {/* ── Mode: Result ── */}
          {mode === 'result' && result && (
            <div className="staff-result-mode">
              <div className="staff-result-icon">
                {actionType === 'clock-in' ? '🟢' : '👋'}
              </div>
              <h2 className="staff-h2" style={{ textAlign: 'center', marginBottom: 8 }}>
                {actionType === 'clock-in' ? 'Clocked In!' : 'Clocked Out!'}
              </h2>
              <p className="staff-result-msg">{result.message}</p>

              <div className="staff-result-details">
                {result.clock_in && (
                  <div className="staff-result-row">
                    <span className="staff-result-label">Clock In</span>
                    <span className="staff-result-value">{formatTime(result.clock_in)}</span>
                  </div>
                )}
                {result.clock_out && (
                  <div className="staff-result-row">
                    <span className="staff-result-label">Clock Out</span>
                    <span className="staff-result-value">{formatTime(result.clock_out)}</span>
                  </div>
                )}
                {result.hours_display && (
                  <div className="staff-result-row highlight">
                    <span className="staff-result-label">Hours Worked</span>
                    <span className="staff-result-value">{result.hours_display}</span>
                  </div>
                )}
              </div>

              <button className="staff-submit-btn" onClick={handleReset} style={{ marginTop: 24 }}>
                Done — Go Back
              </button>
            </div>
          )}
        </div>

        <p className="staff-footer-note">
          For technical issues, please contact the store administrator.
        </p>
      </div>

      <style jsx>{`
        .staff-clock-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .staff-clock-bg {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          z-index: 0;
        }
        .staff-clock-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at center, rgba(227,30,36,0.15) 0%, transparent 60%);
          animation: pulse-bg 8s ease-in-out infinite;
        }
        @keyframes pulse-bg {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
        .staff-clock-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 560px;
          padding: 24px 16px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .staff-clock-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .staff-back-link {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: color 0.2s;
        }
        .staff-back-link:hover { color: #fff; }
        .staff-clock-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .staff-brand-icon { font-size: 22px; }
        .staff-brand-name {
          color: #fff;
          font-weight: 900;
          font-size: 18px;
          letter-spacing: -0.02em;
        }
        .staff-digital-clock {
          text-align: center;
        }
        .staff-time-display {
          font-size: clamp(42px, 10vw, 72px);
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.03em;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 0 40px rgba(227,30,36,0.5);
        }
        .staff-date-display {
          color: rgba(255,255,255,0.6);
          font-size: 15px;
          font-weight: 500;
          margin-top: 4px;
        }
        .staff-clock-card {
          width: 100%;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 28px;
          padding: 32px 28px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.4);
        }
        .staff-card-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-bottom: 28px;
        }
        .staff-h1 {
          color: #fff;
          font-size: 28px;
          font-weight: 900;
          margin: 0;
          text-align: center;
        }
        .staff-h2 {
          color: #fff;
          font-size: 24px;
          font-weight: 900;
          margin: 0;
        }
        .staff-subtitle {
          color: rgba(255,255,255,0.55);
          font-size: 14px;
          margin: 0;
          text-align: center;
        }
        .staff-loading, .staff-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.6);
          padding: 24px 0;
          text-align: center;
          font-size: 15px;
        }
        .staff-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: #e31e24;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .staff-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
        }
        .staff-member-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 16px 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #fff;
        }
        .staff-member-btn:hover {
          background: rgba(227,30,36,0.2);
          border-color: rgba(227,30,36,0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(227,30,36,0.2);
        }
        .staff-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e31e24, #b91c1c);
          color: #fff;
          font-weight: 900;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .staff-avatar-lg {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e31e24, #b91c1c);
          color: #fff;
          font-weight: 900;
          font-size: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 4px rgba(227,30,36,0.3);
        }
        .staff-member-name {
          font-size: 13px;
          font-weight: 700;
          text-align: center;
          line-height: 1.3;
        }
        .staff-back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          display: block;
          transition: color 0.2s;
        }
        .staff-back-btn:hover { color: #fff; }
        .staff-status-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 5px 14px;
          border-radius: 999px;
        }
        .staff-status-badge.clocked-in {
          background: rgba(34,197,94,0.2);
          color: #4ade80;
          border: 1px solid rgba(74,222,128,0.3);
        }
        .staff-status-badge.clocked-out {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.15);
        }
        .staff-status-badge.loading {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          border: 1px solid transparent;
        }
        .staff-action-toggle {
          display: flex;
          gap: 10px;
          margin-bottom: 28px;
        }
        .staff-action-btn {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .staff-action-btn.active-in {
          background: rgba(34,197,94,0.2);
          border-color: rgba(74,222,128,0.4);
          color: #4ade80;
        }
        .staff-action-btn.active-out {
          background: rgba(227,30,36,0.2);
          border-color: rgba(227,30,36,0.4);
          color: #f87171;
        }
        .staff-pin-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .staff-pin-label {
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 600;
        }
        .staff-pin-inputs {
          display: flex;
          gap: 12px;
        }
        .staff-pin-input {
          width: 60px;
          height: 70px;
          border-radius: 14px;
          border: 2px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.08);
          color: #fff;
          font-size: 32px;
          font-weight: 900;
          text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .staff-pin-input:focus {
          border-color: #e31e24;
          box-shadow: 0 0 0 3px rgba(227,30,36,0.25);
        }
        .staff-error {
          color: #f87171;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          padding: 8px 16px;
          background: rgba(239,68,68,0.1);
          border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.2);
        }
        .staff-submit-btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: none;
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .staff-submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .staff-submit-btn:not(:disabled):hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        .staff-result-mode {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .staff-result-icon { font-size: 64px; text-align: center; }
        .staff-result-msg {
          color: rgba(255,255,255,0.7);
          font-size: 15px;
          text-align: center;
          margin: 0;
        }
        .staff-result-details {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        .staff-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .staff-result-row.highlight {
          background: rgba(34,197,94,0.1);
          border-color: rgba(74,222,128,0.2);
        }
        .staff-result-label {
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          font-weight: 600;
        }
        .staff-result-value {
          color: #fff;
          font-size: 15px;
          font-weight: 800;
        }
        .staff-footer-note {
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          text-align: center;
          margin: 0;
        }
        .staff-pin-mode { display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
