import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import TaskModal from '../components/TaskModal';

const COLUMNS = [
  { key: 'todo', label: 'To Do', badge: 'badge-todo', color: '#60a5fa' },
  { key: 'in_progress', label: 'In Progress', badge: 'badge-in_progress', color: '#fbbf24' },
  { key: 'done', label: 'Done', badge: 'badge-done', color: '#a3e635' },
];

const PRIORITY_COLORS = { high: '#f87171', medium: '#fbbf24', low: '#86efac' };

function isOverdue(d) { return d && new Date(d) < new Date() ? true : false; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

function TaskCard({ task, onEdit, onDelete, canEdit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <div style={styles.taskCard} className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: PRIORITY_COLORS[task.priority],
            }} />
            <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{task.title}</span>
          </div>
          {task.description && (
            <p style={{ fontSize: 12, color: '#9090b0', marginBottom: 10, lineHeight: 1.5, marginLeft: 16 }}>
              {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
            </p>
          )}
        </div>
        {canEdit && (
          <div style={{ position: 'relative' }}>
            <button style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>⋮</button>
            {menuOpen && (
              <div style={styles.taskMenu}>
                <button style={styles.menuItem} onClick={() => { onEdit(task); setMenuOpen(false); }}>Edit</button>
                <button style={{ ...styles.menuItem, color: '#f87171' }} onClick={() => { onDelete(task.id); setMenuOpen(false); }}>Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginLeft: 16 }}>
        <span style={{
          fontSize: 11, padding: '2px 8px', borderRadius: 4,
          background: `rgba(${PRIORITY_COLORS[task.priority]
            .match(/\w\w/g)?.map(x => parseInt(x, 16)).join(',')}, 0.1)`,
          color: PRIORITY_COLORS[task.priority], fontWeight: 600,
          fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.3px',
        }}>
          {task.priority}
        </span>
        {task.assigned_to_name && (
          <div style={styles.avatarChip}>
            {task.assigned_to_name.charAt(0)}
            <span style={{ fontSize: 11, color: '#9090b0' }}>{task.assigned_to_name.split(' ')[0]}</span>
          </div>
        )}
        {task.due_date && (
          <span style={{ fontSize: 11, color: overdue ? '#f87171' : '#9090b0', fontFamily: 'Space Mono, monospace', marginLeft: 'auto' }}>
            {overdue ? '⚠ ' : ''}{fmtDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const m = await api.addMember(projectId, form);
      onAdded(m);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle} className="animate-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Add Team Member</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Member Email</label>
            <input type="email" className="form-control" placeholder="colleague@company.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoFocus required />
          </div>
          <div className="form-group">
            <label className="form-label">Project Role</label>
            <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};
const modalStyle = {
  background: '#0e0e1c', border: '1px solid #2a2a45', borderRadius: 16, padding: 28,
  width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
};
const closeBtnStyle = { background: 'none', border: 'none', color: '#5a5a7a', fontSize: 16, cursor: 'pointer' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null);
  const [memberModal, setMemberModal] = useState(false);
  const [tab, setTab] = useState('board');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [proj, taskList] = await Promise.all([api.getProject(id), api.getTasks(id)]);
      setProject(proj);
      setTasks(taskList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const myProjectRole = project?.members?.find(m => m.id === user?.id)?.project_role;
  const canManage = user?.role === 'admin' || myProjectRole === 'admin';

  const filteredTasks = tasks.filter(t =>
    (!filterStatus || t.status === filterStatus) &&
    (!filterPriority || t.priority === filterPriority)
  );

  const tasksByStatus = {};
  COLUMNS.forEach(c => { tasksByStatus[c.key] = filteredTasks.filter(t => t.status === c.key); });

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id, taskId);
      setTasks(ts => ts.filter(t => t.id !== taskId));
    } catch (err) { alert(err.message); }
  };

  const handleSaveTask = (saved) => {
    setTasks(ts => {
      const exists = ts.find(t => t.id === saved.id);
      return exists ? ts.map(t => t.id === saved.id ? saved : t) : [saved, ...ts];
    });
    setTaskModal(null);
  };
  

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (err) { alert(err.message); }
  };

  const handleRemoveMember = async (uid) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.removeMember(id, uid);
      setProject(p => ({ ...p, members: p.members.filter(m => m.id !== uid) }));
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="full-loader"><div className="spinner" /></div>;
  if (error) return (
    <div className="page animate-in">
      <div className="card" style={{ textAlign: 'center', padding: '60px 24px', color: '#f87171' }}>
        <p>{error}</p>
        <Link to="/projects" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back to Projects</Link>
      </div>
    </div>
  );

  return (
    <div className="page animate-in">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#9090b0' }}>
        <Link to="/projects" style={{ color: '#9090b0', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <span style={{ color: '#f0f0fa' }}>{project?.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">{project?.name}</h1>
          {project?.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canManage && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setMemberModal(true)}>+ Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setTaskModal('new')}>+ Task</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {COLUMNS.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#0e0e1c', border: '1px solid #1e1e35', borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
            <span style={{ fontSize: 13, color: '#9090b0' }}>{c.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{tasksByStatus[c.key]?.length || 0}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#0e0e1c', border: '1px solid #1e1e35', borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: '#9090b0' }}>Members</span>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{project?.members?.length || 0}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #1e1e35', paddingBottom: 4 }}>
        {[{ key: 'board', label: 'Board' }, { key: 'members', label: 'Members' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, fontFamily: 'Outfit, sans-serif',
            color: tab === t.key ? '#f0f0fa' : '#9090b0',
            borderBottom: tab === t.key ? '2px solid #a3e635' : '2px solid transparent',
            marginBottom: -5, transition: 'all 0.15s ease',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <select className="form-control" style={{ width: 'auto', minWidth: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="form-control" style={{ width: 'auto', minWidth: 130 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {(filterStatus || filterPriority) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>Clear filters</button>
            )}
          </div>

          {/* Kanban Board */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
            {COLUMNS.map(col => (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9090b0' }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: '#5a5a7a',
                    background: '#141428', padding: '2px 8px', borderRadius: 99 }}>
                    {tasksByStatus[col.key]?.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200 }}>
                  {tasksByStatus[col.key]?.length === 0 && (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#3a3a55', fontSize: 13, border: '1px dashed #1e1e35', borderRadius: 10 }}>
                      No tasks
                    </div>
                  )}
                  {tasksByStatus[col.key]?.map(task => (
                    <TaskCard
                      key={task.id} task={task}
                      onEdit={t => setTaskModal(t)}
                      onDelete={handleDeleteTask}
                      canEdit={canManage || task.assigned_to === user?.id || task.created_by === user?.id}
                    />
                  ))}
                  <button
                    style={styles.addTaskBtn}
                    onClick={() => setTaskModal({ status: col.key })}
                  >
                    + Add task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'members' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Team Members ({project?.members?.length})</h2>
            {canManage && (
              <button className="btn btn-primary btn-sm" onClick={() => setMemberModal(true)}>+ Add Member</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#1e1e35', borderRadius: 12, overflow: 'hidden' }}>
            {project?.members?.map(m => (
              <div key={m.id} style={{ background: '#0e0e1c', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: m.id === project.owner_id ? '#a3e635' : '#2a2a45',
                  color: m.id === project.owner_id ? '#08080f' : '#f0f0fa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15, flexShrink: 0,
                }}>
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: '#9090b0' }}>{m.email}</div>
                </div>
                <span className={`badge badge-${m.project_role}`}>{m.project_role}</span>
                {m.system_role === 'admin' && <span className="badge badge-admin">admin</span>}
                {canManage && m.id !== user?.id && (
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemoveMember(m.id)}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {taskModal && (
        <TaskModal
          projectId={parseInt(id, 10)}
          task={taskModal === 'new' ? null : (taskModal?.id ? taskModal : { status: taskModal?.status || 'todo' })}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
        />
      )}
      {memberModal && (
        <AddMemberModal
          projectId={parseInt(id, 10)}
          onClose={() => setMemberModal(false)}
          onAdded={m => { setProject(p => ({ ...p, members: [...(p.members || []), { ...m, project_role: m.project_role || 'member' }] })); setMemberModal(false); }}
        />
      )}
    </div>
  );
}

const styles = {
  taskCard: {
    background: '#0e0e1c', border: '1px solid #1e1e35', borderRadius: 10, padding: 16,
    cursor: 'pointer', transition: 'all 0.15s ease',
    ':hover': { borderColor: '#2a2a45' },
  },
  menuBtn: {
    background: 'none', border: 'none', color: '#5a5a7a', fontSize: 18,
    cursor: 'pointer', padding: '0 4px', lineHeight: 1,
    ':hover': { color: '#f0f0fa' },
  },
  taskMenu: {
    position: 'absolute', right: 0, top: '100%',
    background: '#0e0e1c', border: '1px solid #2a2a45',
    borderRadius: 8, overflow: 'hidden', minWidth: 110,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50,
  },
  menuItem: {
    width: '100%', padding: '9px 14px', background: 'none', border: 'none',
    textAlign: 'left', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    color: '#f0f0fa', fontFamily: 'Outfit, sans-serif',
  },
  avatarChip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#141428', padding: '2px 8px 2px 5px', borderRadius: 99,
  },
  addTaskBtn: {
    width: '100%', padding: '10px', background: 'transparent',
    border: '1px dashed #2a2a45', borderRadius: 8,
    color: '#5a5a7a', fontSize: 13, cursor: 'pointer',
    fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s ease',
  },
};
