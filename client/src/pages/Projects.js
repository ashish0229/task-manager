import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setLoading(true); setError('');
    try {
      const p = await api.createProject(form);
      onCreated(p);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal} className="animate-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>New Project</h2>
            <p style={{ color: '#9090b0', fontSize: 13, marginTop: 2 }}>Create a workspace for your team</p>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-control" placeholder="e.g. Website Redesign"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" placeholder="What's this project about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const modal = {
  background: '#0e0e1c', border: '1px solid #2a2a45', borderRadius: 16, padding: 28,
  width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
};
const closeBtn = { background: 'none', border: 'none', color: '#5a5a7a', fontSize: 16, cursor: 'pointer', padding: 4 };

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = (p) => {
    setShowNew(false);
    navigate(`/projects/${p.id}`);
  };

  if (loading) return (
    <div className="full-loader"><div className="spinner" /></div>
  );

  return (
    <div className="page animate-in">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Project</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 28 }}>
        <input
          className="form-control"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: 40, marginBottom: 16 }}>◈</div>
          <h3>{search ? 'No projects match your search' : 'No projects yet'}</h3>
          <p>{!search && 'Create your first project to get started.'}</p>
          {!search && (
            <button className="btn btn-primary" style={{ margin: '20px auto 0' }} onClick={() => setShowNew(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(p => {
            const total = parseInt(p.task_count) || 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  {/* Color accent based on project id */}
                  <div style={{
                    height: 3, borderRadius: '99px 99px 0 0', marginBottom: 20,
                    background: COLORS[p.id % COLORS.length],
                    marginLeft: -24, marginRight: -24, marginTop: -24,
                    borderRadius: '12px 12px 0 0',
                  }} />

                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>{p.name}</div>
                  {p.description && (
                    <p style={{ fontSize: 13, color: '#9090b0', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
                      {p.description.slice(0, 100)}{p.description.length > 100 ? '…' : ''}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#9090b0', marginBottom: 12 }}>
                      <span>{total} task{total !== 1 ? 's' : ''}</span>
                      <span>{p.member_count} member{p.member_count !== 1 ? 's' : ''}</span>
                      {p.my_role && <span className={`badge badge-${p.my_role}`}>{p.my_role}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5a5a7a' }}>
                      <span>by {p.owner_name}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  );
}

const COLORS = ['#a3e635', '#60a5fa', '#a78bfa', '#fbbf24', '#f87171', '#34d399'];
