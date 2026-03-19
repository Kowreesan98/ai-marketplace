import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

const HOUR_OPTIONS = [0.5, 1, 2, 3, 5, 8];

export default function HireFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(1);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'success'
  const [hiring, setHiring] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    api.get(`/agents/${id}`)
      .then(res => setAgent(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const total = agent ? (agent.rate * hours).toFixed(2) : '0.00';

  const handleConfirm = async () => {
    setHiring(true);
    setError('');
    try {
      const { data } = await api.post('/sessions', {
        agent_id: parseInt(id),
        duration_hours: hours,
      });
      setSessionId(data.session_id);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session');
    } finally {
      setHiring(false);
    }
  };

  if (loading) return <div style={styles.center}><Spinner size={36} /></div>;
  if (!agent) return null;

  if (step === 'success') {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Session started!</h2>
          <p style={styles.successText}>
            You've hired <strong>{agent.name}</strong> for {hours} {hours === 1 ? 'hour' : 'hours'}.
            Your session is now active.
          </p>
          <div style={styles.successMeta}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Total charged</span>
              <span style={styles.metaVal}>${total}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Duration</span>
              <span style={styles.metaVal}>{hours}h</span>
            </div>
          </div>
          <button
            style={styles.goBtn}
            onClick={() => navigate(`/workspace/${sessionId}`)}
          >
            Open workspace →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Confirm your hire</h2>
          <div style={styles.confirmBlock}>
            <div style={styles.agentRow}>
              <span style={{ fontSize: 32 }}>{agent.icon}</span>
              <div>
                <div style={styles.agentName}>{agent.name}</div>
                <div style={styles.agentDesc}>{agent.description}</div>
              </div>
            </div>
            <div style={styles.divider} />
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Duration</span>
              <span style={styles.summaryVal}>{hours} {hours === 1 ? 'hour' : 'hours'}</span>
            </div>
            <div style={styles.summaryRow}>
              <span style={styles.summaryLabel}>Rate</span>
              <span style={styles.summaryVal}>${agent.rate}/hr</span>
            </div>
            <div style={styles.divider} />
            <div style={{ ...styles.summaryRow, marginTop: 4 }}>
              <span style={{ ...styles.summaryLabel, color: 'var(--text)', fontWeight: 600 }}>Total</span>
              <span style={styles.totalVal}>${total}</span>
            </div>
          </div>

          {/* Mock payment notice */}
          <div style={styles.mockBadge}>
            Mock payment — no real charge
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.btnRow}>
            <button style={styles.backBtn} onClick={() => setStep('select')}>
              Go back
            </button>
            <button
              style={{ ...styles.confirmBtn, opacity: hiring ? 0.7 : 1 }}
              onClick={handleConfirm}
              disabled={hiring}
            >
              {hiring ? <Spinner size={18} color="#fff" /> : 'Confirm & pay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: select hours
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.agentRow}>
          <span style={{ fontSize: 32 }}>{agent.icon}</span>
          <div>
            <div style={styles.agentName}>{agent.name}</div>
            <div style={styles.agentDesc}>{agent.description}</div>
          </div>
        </div>

        <div style={styles.divider} />

        <h3 style={styles.selectLabel}>How many hours do you need?</h3>

        <div style={styles.hourGrid}>
          {HOUR_OPTIONS.map(h => (
            <button
              key={h}
              style={{
                ...styles.hourBtn,
                ...(hours === h ? styles.hourBtnActive : {}),
              }}
              onClick={() => setHours(h)}
            >
              {h === 0.5 ? '30 min' : `${h}h`}
            </button>
          ))}
        </div>

        <div style={styles.customRow}>
          <label style={styles.customLabel}>Or enter custom hours:</label>
          <input
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={hours}
            onChange={e => setHours(parseFloat(e.target.value) || 0.5)}
            style={styles.customInput}
          />
        </div>

        <div style={styles.totalPreview}>
          <span style={styles.previewLabel}>Estimated total</span>
          <span style={styles.previewTotal}>${total}</span>
        </div>

        <button style={styles.nextBtn} onClick={() => setStep('confirm')}>
          Continue to checkout →
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 520, margin: '0 auto', padding: '40px 24px' },
  center: { display: 'flex', justifyContent: 'center', padding: 80 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 32,
    animation: 'fadeIn 0.3s ease',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 24,
  },
  agentRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  agentName: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 },
  agentDesc: { color: 'var(--text-muted)', fontSize: 13, marginTop: 3 },
  divider: { height: 1, background: 'var(--border)', margin: '20px 0' },
  selectLabel: {
    fontSize: 15, fontWeight: 600, marginBottom: 14, color: 'var(--text-muted)',
  },
  hourGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 },
  hourBtn: {
    padding: '10px 0', borderRadius: 8,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
    transition: 'all 0.15s',
  },
  hourBtnActive: {
    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
    color: 'var(--accent-light)',
  },
  customRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  customLabel: { color: 'var(--text-muted)', fontSize: 13 },
  customInput: {
    width: 80, padding: '8px 12px', borderRadius: 8,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 14,
  },
  totalPreview: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--bg-hover)', borderRadius: 10, padding: '14px 18px', marginBottom: 20,
  },
  previewLabel: { color: 'var(--text-muted)', fontSize: 14 },
  previewTotal: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 },
  nextBtn: {
    width: '100%', padding: '14px', borderRadius: 10,
    background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600,
  },
  confirmBlock: { marginBottom: 20 },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between',
    marginBottom: 10, fontSize: 14,
  },
  summaryLabel: { color: 'var(--text-muted)' },
  summaryVal: { fontWeight: 500 },
  totalVal: {
    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--accent-light)',
  },
  mockBadge: {
    textAlign: 'center', fontSize: 12, color: 'var(--amber)',
    background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 8, padding: '8px', marginBottom: 16,
  },
  errorBox: {
    background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
    color: 'var(--red)', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, marginBottom: 16,
  },
  btnRow: { display: 'flex', gap: 10 },
  backBtn: {
    flex: 1, padding: '12px', borderRadius: 10,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
  },
  confirmBtn: {
    flex: 2, padding: '12px', borderRadius: 10,
    background: 'var(--accent)', color: '#fff',
    fontSize: 15, fontWeight: 600, display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  successCard: {
    background: 'var(--bg-card)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center',
    animation: 'fadeIn 0.3s ease',
  },
  successIcon: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.3)',
    color: 'var(--green)', fontSize: 28, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  },
  successTitle: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 10 },
  successText: { color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 },
  successMeta: {
    display: 'flex', justifyContent: 'center', gap: 40,
    background: 'var(--bg-hover)', borderRadius: 10, padding: '16px 32px', marginBottom: 28,
  },
  metaItem: { textAlign: 'center' },
  metaLabel: { display: 'block', color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 },
  metaVal: { display: 'block', fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 },
  goBtn: {
    padding: '12px 32px', borderRadius: 10,
    background: 'var(--accent)', color: '#fff', fontSize: 15, fontWeight: 600,
  },
};
