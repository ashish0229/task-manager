import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function TaskModal({ projectId, task, onClose, onSave }) {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date?.slice(0, 10) || '',
    assigned_to: task?.assigned_to || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getMembers(projectId).then(setMembers).catch(() => {});
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [projectId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
      };
      let saved;
      if (task) {
        saved = await api.updateTask(projectId, task.id, payload);
      } else {
        saved = await api.createTask(projectId, payload);
      }
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="animate-in">
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>{task ? 'Edit Task' : 'New Task'}</h2>
            <p style={styles.subtitle}>Fill in the details below</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              className="form-control"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              placeholder="Add more context..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
            />
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Assign To</label>
              <select className="form-control" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

          <div style={styles.actions}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: '#0e0e1c', border: '1px solid #2a2a45',
    borderRadius: 16, padding: 28, width: '100%', maxWidth: 560,
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' },
  subtitle: { fontSize: 13, color: '#9090b0', marginTop: 2 },
  closeBtn: {
    background: 'none', border: 'none', color: '#5a5a7a',
    fontSize: 16, cursor: 'pointer', padding: 4, lineHeight: 1,
    ':hover': { color: '#f0f0fa' },
  },
  row: { display: 'flex', gap: 16 },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 },
};
