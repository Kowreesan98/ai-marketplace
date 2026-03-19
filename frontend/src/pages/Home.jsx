import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Spinner from '../components/Spinner';

const CATEGORY_COLORS = {
  Documents: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
  Writing:   { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', text: '#c084fc' },
  Education: { bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)',  text: '#4ade80' },
  Development:{ bg: 'rgba(245,158,11,0.1)',border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
  Analytics: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  text: '#f87171' },
};

function AgentCard({ agent, onHire }) {
  const [hovered, setHovered] = useState(false);
  const cat = CATEGORY_COLORS[agent.category] || CATEGORY_COLORS.Documents;

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered ? styles.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.cardTop}>
        <div style={styles.iconWrap}>
          <span style={{ fontSize: 28 }}>{agent.icon}</span>
        </div>
        <span style={{ ...styles.badge, background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>
          {agent.category}
        </span>
      </div>

      <h3 style={styles.cardTitle}>{agent.name}</h3>
      <p style={styles.cardDesc}>{agent.description}</p>

      <div style={styles.cardFooter}>
        <div style={styles.rate}>
          <span style={styles.rateNum}>${agent.rate}</span>
          <span style={styles.rateLabel}> / hour</span>
        </div>
        <button
          style={styles.hireBtn}
          onClick={() => onHire(agent.id)}
          onMouseEnter={e => e.currentTarget.style.background = '#6b4fe0'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          Hire agent
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/agents')
      .then(res => setAgents(res.data))
      .catch(() => setError('Failed to load agents. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleHire = (agentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: { pathname: `/hire/${agentId}` } } });
    } else {
      navigate(`/hire/${agentId}`);
    }
  };

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>5 specialized AI agents</div>
          <h1 style={styles.heroTitle}>
            Hire AI agents<br />
            <span style={styles.heroAccent}>by the hour</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Browse expert AI agents for writing, coding, learning, and more.
            Pay only for the time you use.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Available agents</h2>
          <span style={styles.sectionCount}>{agents.length} agents</span>
        </div>

        {loading && (
          <div style={styles.center}>
            <Spinner size={32} />
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {!loading && !error && (
          <div style={styles.grid}>
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} onHire={handleHire} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' },

  hero: {
    position: 'relative', overflow: 'hidden',
    textAlign: 'center', padding: '80px 24px 72px',
  },
  heroGlow: {
    position: 'absolute', top: '30%', left: '50%',
    transform: 'translate(-50%,-50%)',
    width: 600, height: 300,
    background: 'radial-gradient(ellipse, rgba(124,92,252,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroBadge: {
    display: 'inline-block', marginBottom: 20,
    padding: '5px 14px', borderRadius: 20,
    background: 'var(--accent-dim)', border: '1px solid rgba(124,92,252,0.3)',
    color: 'var(--accent-light)', fontSize: 13, fontWeight: 500,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 56, fontWeight: 800, lineHeight: 1.1,
    marginBottom: 20,
  },
  heroAccent: { color: 'var(--accent-light)' },
  heroSubtitle: {
    color: 'var(--text-muted)', fontSize: 18, maxWidth: 520,
    margin: '0 auto', lineHeight: 1.7,
  },

  section: { paddingTop: 8 },
  sectionHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22, fontWeight: 700,
  },
  sectionCount: {
    color: 'var(--text-muted)', fontSize: 14,
    background: 'var(--bg-card)',
    padding: '4px 12px', borderRadius: 20,
    border: '1px solid var(--border)',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },

  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
    animation: 'fadeIn 0.4s ease both',
  },
  cardHover: {
    borderColor: 'var(--border-light)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  cardTop: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 16,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 12,
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    borderRadius: 20, letterSpacing: 0.3, textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 18, fontWeight: 700, marginBottom: 8,
  },
  cardDesc: {
    color: 'var(--text-muted)', fontSize: 14,
    lineHeight: 1.6, marginBottom: 20, minHeight: 44,
  },
  cardFooter: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16, borderTop: '1px solid var(--border)',
  },
  rate: { display: 'flex', alignItems: 'baseline', gap: 2 },
  rateNum: { fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' },
  rateLabel: { color: 'var(--text-muted)', fontSize: 13 },
  hireBtn: {
    padding: '8px 18px', borderRadius: 8,
    background: 'var(--accent)', color: '#fff',
    fontSize: 14, fontWeight: 600,
    transition: 'background 0.15s',
  },

  center: { display: 'flex', justifyContent: 'center', padding: 60 },
  errorBox: {
    background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
    color: 'var(--red)', borderRadius: 12, padding: '16px 20px',
    fontSize: 14,
  },
};
