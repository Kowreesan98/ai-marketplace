import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoMark} />
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.subtitle}>Join AgentHub and hire your first AI agent</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full name</label>
            <input
              type="text" name="name"
              value={form.name} onChange={handleChange}
              placeholder="Jane Doe"
              required style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              required style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="Min. 6 characters"
              required style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Spinner size={18} color="#fff" /> : 'Create account'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.switchLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 64px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 400,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 36,
    animation: 'fadeIn 0.3s ease',
  },
  logoMark: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--accent)', boxShadow: '0 0 16px var(--accent)',
    marginBottom: 24,
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 6 },
  subtitle: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 },
  errorBox: {
    background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
    color: 'var(--red)', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  input: {
    padding: '11px 14px', borderRadius: 8,
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: 14, transition: 'border-color 0.15s',
  },
  submitBtn: {
    padding: '13px', borderRadius: 10,
    background: 'var(--accent)', color: '#fff',
    fontSize: 15, fontWeight: 600, marginTop: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  switchText: { textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20 },
  switchLink: { color: 'var(--accent-light)', fontWeight: 500 },
};
