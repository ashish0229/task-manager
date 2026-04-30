import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background grid */}
      <div style={styles.grid} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoBlock}>
          <div style={styles.logoIcon}>⬡</div>
          <div style={styles.logoName}>TaskFlow</div>
        </div>

        <div style={styles.card}>
          <h1 style={styles.heading}>Welcome back</h1>
          <p style={styles.sub}>Sign in to your workspace</p>

          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4, height: 44, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Sign In'}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>New to TaskFlow?</span>
          </div>

          <Link to="/signup" style={styles.signupLink}>
            Create an account →
          </Link>
        </div>

        <p style={styles.hint}>
          Demo: sign up as <strong>admin</strong> to manage everything, or <strong>member</strong> to join projects.
        </p>
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
    backgroundImage: `
      linear-gradient(rgba(163,230,53,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(163,230,53,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
    maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%)',
  },
  container: {
    width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logoBlock: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40,
  },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: '#a3e635',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, color: '#08080f', fontFamily: 'Space Mono, monospace',
  },
  logoName: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' },
  card: {
    background: '#0e0e1c', border: '1px solid #1e1e35',
    borderRadius: 16, padding: 32, width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  heading: { fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px' },
  sub: { fontSize: 14, color: '#9090b0', marginTop: 4 },
  errorBox: {
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#f87171',
    marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
  },
  divider: {
    textAlign: 'center', margin: '24px 0 16px',
    position: 'relative',
  },
  dividerText: {
    fontSize: 13, color: '#5a5a7a',
    background: '#0e0e1c', padding: '0 12px',
  },
  signupLink: {
    display: 'block', textAlign: 'center',
    color: '#a3e635', fontWeight: 600, fontSize: 14,
    textDecoration: 'none',
  },
  hint: {
    marginTop: 24, fontSize: 12, color: '#5a5a7a', textAlign: 'center', lineHeight: 1.6,
  },
};
