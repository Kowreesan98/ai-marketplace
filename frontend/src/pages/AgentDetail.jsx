import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/agents/${id}`)
      .then(res => setAgent(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div style={styles.center}><Spinner size={36} /></div>
  );

  if (!agent) return null;

  const handleHire = () => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login', { state: { from: { pathname: `/hire/${id}` } } });
    else navigate(`/hire/${id}`);
  };

  return (
    <div style={styles.page}>
      <Link to="/" style={styles.back}>← Back to marketplace</Link>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <span style={{ fontSize: 40 }}>{agent.icon}</span>
          </div>
          <div>
            <h1 style={styles.title}>{agent.name}</h1>
            <span style={styles.category}>{agent.category}</span>
          </div>
        </div>

        <p style={styles.desc}>{agent.long_description}</p>

        <div style={styles.rateBox}>
          <div>
            <div style={styles.rateBig}>${agent.rate}<span style={styles.rateSmall}>/hr</span></div>
            <div style={styles.rateSub}>Billed per session</div>
          </div>
          <button style={styles.hireBtn} onClick={handleHire}>
            Hire this agent →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 700, margin: '0 auto', padding: '32px 24px' },
  center: { display: 'flex', justifyContent: 'center', padding: 80 },
  back: { color: 'var(--text-muted)', fontSize: 14, display: 'inline-block', marginBottom: 24 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 36,
  },
  header: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 16,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 6 },
  category: {
    fontSize: 12, fontWeight: 600, padding: '3px 10px',
    borderRadius: 20, background: 'var(--accent-dim)',
    border: '1px solid rgba(124,92,252,0.3)', color: 'var(--accent-light)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  desc: {
    color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7,
    marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border)',
  },
  rateBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  rateBig: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800 },
  rateSmall: { fontSize: 18, color: 'var(--text-muted)' },
  rateSub: { color: 'var(--text-muted)', fontSize: 13, marginTop: 2 },
  hireBtn: {
    padding: '12px 28px', borderRadius: 10,
    background: 'var(--accent)', color: '#fff',
    fontSize: 16, fontWeight: 600,
  },
};
