import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true); setError('');
    try {
      await signup(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.container}>
        <div style={styles.logoBlock}>
          <div style={styles.logoIcon}>⬡</div>
          <div style={styles.logoName}>TaskFlow</div>
        </div>

        <div style={styles.card}>
          <h1 style={styles.heading}>Create account</h1>
          <p style={styles.sub}>Join your team's workspace</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" placeholder="Alex Johnson" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="you@company.com" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Min. 6 characters" value={form.password}
                onChange={e => set('password', e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={styles.roleGrid}>
                {[
                  { value: 'member', label: 'Member', desc: 'Join and contribute to projects', icon: '◈' },
                  { value: 'admin', label: 'Admin', desc: 'Manage all projects and users', icon: '⬡' },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    style={{
                      ...styles.roleCard,
                      ...(form.role === r.value ? styles.roleCardActive : {}),
                    }}
                    onClick={() => set('role', r.value)}
                  >
                    <div style={styles.roleIcon}>{r.icon}</div>
                    <div style={styles.roleLabel}>{r.label}</div>
                    <div style={styles.roleDesc}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div style={styles.errorBox}><span>⚠</span> {error}</div>
            )}

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 15, marginTop: 4 }}
              disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Create Account'}
            </button>
          </form>

          <div style={styles.loginRow}>
            Already have an account? <Link to="/login" style={styles.loginLink}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#08080f', padding: 24, position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `linear-gradient(rgba(163,230,53,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(163,230,53,0.03) 1px, transparent 1px)`,
    backgroundSize: '48px 48px',
    maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%)',
  },
  container: {
    width: '100%', maxWidth: 480, position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logoBlock: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12, background: '#a3e635',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, color: '#08080f', fontFamily: 'Space Mono, monospace',
  },
  logoName: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' },
  card: {
    background: '#0e0e1c', border: '1px solid #1e1e35', borderRadius: 16, padding: 32, width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  heading: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px' },
  sub: { fontSize: 14, color: '#9090b0', marginTop: 4 },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  roleCard: {
    background: '#12121f', border: '2px solid #1e1e35', borderRadius: 10, padding: 16,
    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
  },
  roleCardActive: { borderColor: '#a3e635', background: 'rgba(163,230,53,0.06)' },
  roleIcon: { fontSize: 20, marginBottom: 8, color: '#a3e635' },
  roleLabel: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  roleDesc: { fontSize: 12, color: '#9090b0', lineHeight: 1.4 },
  errorBox: {
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171',
    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  loginRow: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#9090b0' },
  loginLink: { color: '#a3e635', fontWeight: 600 },
};
