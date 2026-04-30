import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/projects', label: 'Projects', icon: '◈' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/dashboard" style={styles.logo}>
          <span style={styles.logoMark}>⬡</span>
          <span style={styles.logoText}>TaskFlow</span>
        </Link>

        {/* Links */}
        <div style={styles.links}>
          {NAV_LINKS.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              style={{
                ...styles.link,
                ...(pathname.startsWith(path) ? styles.linkActive : {}),
              }}
            >
              <span style={styles.linkIcon}>{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        {/* User */}
        <div style={styles.userSection}>
          {user?.role === 'admin' && (
            <span style={styles.adminBadge}>ADMIN</span>
          )}
          <div style={{ position: 'relative' }}>
            <button
              style={styles.avatar}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </button>
            {menuOpen && (
              <div style={styles.dropdown}>
                <div style={styles.dropdownHeader}>
                  <div style={styles.dropdownName}>{user?.name}</div>
                  <div style={styles.dropdownEmail}>{user?.email}</div>
                </div>
                <div style={styles.dropdownDivider} />
                <button style={styles.dropdownItem} onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom border accent */}
      <div style={styles.navAccent} />
    </nav>
  );
}

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(8,8,15,0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid #1e1e35',
  },
  inner: {
    maxWidth: 1400, margin: '0 auto',
    padding: '0 24px',
    height: 60,
    display: 'flex', alignItems: 'center', gap: 32,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none', marginRight: 16,
  },
  logoMark: {
    fontSize: 20, color: '#a3e635',
    fontFamily: 'Space Mono, monospace',
  },
  logoText: {
    fontSize: 16, fontWeight: 800,
    letterSpacing: '-0.5px',
    color: '#f0f0fa',
  },
  links: { display: 'flex', gap: 4, flex: 1 },
  link: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', borderRadius: 6,
    fontSize: 14, fontWeight: 500,
    color: '#9090b0', textDecoration: 'none',
    transition: 'all 0.15s ease',
  },
  linkActive: {
    color: '#f0f0fa', background: '#141428',
  },
  linkIcon: { fontSize: 12, opacity: 0.7 },
  userSection: { display: 'flex', alignItems: 'center', gap: 12 },
  adminBadge: {
    fontSize: 10, fontWeight: 700,
    padding: '3px 8px', borderRadius: 4,
    background: 'rgba(167,139,250,0.12)',
    color: '#a78bfa',
    fontFamily: 'Space Mono, monospace',
    letterSpacing: '0.5px',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: '#a3e635', color: '#08080f',
    fontWeight: 800, fontSize: 14,
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
    background: '#0e0e1c', border: '1px solid #2a2a45',
    borderRadius: 10, overflow: 'hidden',
    minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    zIndex: 200,
  },
  dropdownHeader: { padding: '14px 16px' },
  dropdownName: { fontWeight: 600, fontSize: 14 },
  dropdownEmail: { fontSize: 12, color: '#9090b0', marginTop: 2 },
  dropdownDivider: { height: 1, background: '#1e1e35' },
  dropdownItem: {
    width: '100%', padding: '11px 16px',
    background: 'none', border: 'none',
    textAlign: 'left', fontSize: 14, color: '#f87171',
    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
    fontWeight: 500,
    ':hover': { background: '#141428' },
  },
  navAccent: { height: 1, background: 'transparent' },
};
