import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

function formatDuration(ms) {
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions')
      .then(res => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = sessions.filter(s => !s.expired);
  const past = sessions.filter(s => s.expired);
  const totalSpent = sessions.reduce((sum, s) => sum + s.total_cost, 0);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
        <Link to="/" style={styles.browseBtn}>Browse agents →</Link>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{sessions.length}</div>
          <div style={styles.statLabel}>Total sessions</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>{active.length}</div>
          <div style={styles.statLabel}>Active now</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNum}>${totalSpent.toFixed(2)}</div>
          <div style={styles.statLabel}>Total spent</div>
        </div>
      </div>

      {loading && <div style={styles.center}><Spinner size={32} /></div>}

      {!loading && sessions.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🤖</div>
          <h3 style={styles.emptyTitle}>No sessions yet</h3>
          <p style={styles.emptyText}>Head to the marketplace and hire your first AI agent.</p>
          <Link to="/" style={styles.goBtn}>Browse agents</Link>
        </div>
      )}

      {/* Active sessions */}
      {!loading && active.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.activeDot} /> Active sessions
          </h2>
          <div style={styles.sessionList}>
            {active.map(s => (
              <div key={s.id} style={{ ...styles.sessionCard, ...styles.sessionCardActive }}>
                <div style={styles.sessionLeft}>
                  <span style={styles.sessionIcon}>{s.agent_icon}</span>
                  <div>
                    <div style={styles.sessionName}>{s.agent_name}</div>
                    <div style={styles.sessionMeta}>Started {formatDate(s.start_time)}</div>
                  </div>
                </div>
                <div style={styles.sessionRight}>
                  <div style={{ color: 'var(--green)', fontSize: 14, fontWeight: 600 }}>
                    {formatDuration(s.remaining_ms)}
                  </div>
                  <div style={styles.sessionCost}>${s.total_cost.toFixed(2)}</div>
                  <button
                    style={styles.openBtn}
                    onClick={() => navigate(`/workspace/${s.id}`)}
                  >
                    Open workspace
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past sessions */}
      {!loading && past.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Past sessions</h2>
          <div style={styles.sessionList}>
            {past.map(s => (
              <div key={s.id} style={styles.sessionCard}>
                <div style={styles.sessionLeft}>
                  <span style={{ ...styles.sessionIcon, opacity: 0.5 }}>{s.agent_icon}</span>
                  <div>
                    <div style={styles.sessionName}>{s.agent_name}</div>
                    <div style={styles.sessionMeta}>{formatDate(s.start_time)} · {s.duration_hours}h session</div>
                  </div>
                </div>
                <div style={styles.sessionRight}>
                  <span style={styles.expiredBadge}>Expired</span>
                  <div style={styles.sessionCost}>${s.total_cost.toFixed(2)}</div>
                  <Link to={`/hire/${s.agent_id}`} style={styles.rehireBtn}>
                    Hire again
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' },
  header: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 32,
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, marginBottom: 4 },
  subtitle: { color: 'var(--text-muted)', fontSize: 15 },
  browseBtn: {
    padding: '10px 20px', borderRadius: 10,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
    marginTop: 6,
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36 },
  statCard: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '20px 24px',
  },
  statNum: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 4 },
  statLabel: { color: 'var(--text-muted)', fontSize: 13 },

  section: { marginBottom: 32 },
  sectionTitle: {
    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
  },
  activeDot: {
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: 'var(--green)',
    boxShadow: '0 0 8px var(--green)',
    animation: 'pulse 2s infinite',
  },

  sessionList: { display: 'flex', flexDirection: 'column', gap: 10 },
  sessionCard: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '16px 20px',
  },
  sessionCardActive: { borderColor: 'rgba(34,197,94,0.25)' },
  sessionLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  sessionIcon: { fontSize: 28, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sessionName: { fontWeight: 600, fontSize: 15, marginBottom: 3 },
  sessionMeta: { color: 'var(--text-muted)', fontSize: 12 },
  sessionRight: { display: 'flex', alignItems: 'center', gap: 14 },
  sessionCost: { color: 'var(--text-muted)', fontSize: 14 },
  openBtn: {
    padding: '7px 14px', borderRadius: 8,
    background: 'var(--accent)', color: '#fff',
    fontSize: 13, fontWeight: 600,
  },
  expiredBadge: {
    padding: '3px 10px', borderRadius: 20,
    background: 'var(--red-dim)', color: 'var(--red)',
    fontSize: 11, fontWeight: 600,
  },
  rehireBtn: {
    padding: '7px 14px', borderRadius: 8,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontSize: 13,
  },

  center: { display: 'flex', justifyContent: 'center', padding: 60 },
  emptyState: {
    textAlign: 'center', padding: '60px 24px',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 },
  emptyText: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 },
  goBtn: {
    display: 'inline-block', padding: '10px 24px',
    borderRadius: 10, background: 'var(--accent)',
    color: '#fff', fontSize: 14, fontWeight: 600,
  },
};
