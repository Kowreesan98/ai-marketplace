import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoDot} />
          AgentHub
        </Link>

        <div style={styles.links}>
          <Link to="/" style={{ ...styles.link, ...(isActive('/') ? styles.linkActive : {}) }}>
            Marketplace
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard" style={{ ...styles.link, ...(isActive('/dashboard') ? styles.linkActive : {}) }}>
              Dashboard
            </Link>
          )}
        </div>

        <div style={styles.right}>
          {isAuthenticated ? (
            <>
              <span style={styles.userName}>Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.loginBtn}>Sign in</Link>
              <Link to="/signup" style={styles.signupBtn}>Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(10,10,15,0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border)',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto',
    padding: '0 24px', height: 64,
    display: 'flex', alignItems: 'center', gap: 32,
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: 20, fontWeight: 700,
    color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 8,
    marginRight: 8,
  },
  logoDot: {
    width: 8, height: 8,
    borderRadius: '50%',
    background: 'var(--accent)',
    display: 'inline-block',
    boxShadow: '0 0 8px var(--accent)',
  },
  links: { display: 'flex', gap: 4, flex: 1 },
  link: {
    padding: '6px 14px', borderRadius: 8,
    color: 'var(--text-muted)', fontSize: 14,
    fontWeight: 500, transition: 'color 0.15s',
  },
  linkActive: { color: 'var(--text)', background: 'var(--bg-hover)' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  userName: { color: 'var(--text-muted)', fontSize: 14 },
  loginBtn: {
    padding: '7px 16px', borderRadius: 8, fontSize: 14,
    color: 'var(--text-muted)', fontWeight: 500,
    transition: 'color 0.15s',
  },
  signupBtn: {
    padding: '7px 16px', borderRadius: 8, fontSize: 14,
    background: 'var(--accent)', color: '#fff',
    fontWeight: 500,
  },
  logoutBtn: {
    padding: '7px 16px', borderRadius: 8, fontSize: 14,
    background: 'var(--bg-hover)', color: 'var(--text-muted)',
    fontWeight: 500,
  },
};
