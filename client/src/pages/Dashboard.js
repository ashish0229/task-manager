import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

const STAT_CONFIGS = [
  { key: 'total_projects', label: 'Projects', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: '◈' },
  { key: 'total_tasks', label: 'Total Tasks', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: '⬡' },
  { key: 'in_progress_count', label: 'In Progress', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: '◐' },
  { key: 'overdue_count', label: 'Overdue', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: '!' },
];

function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>;
}

function PriorityDot({ priority }) {
  const colors = { high: '#f87171', medium: '#fbbf24', low: '#86efac' };
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[priority], display: 'inline-block', flexShrink: 0 }} />;
}

function isOverdue(due) { return due && new Date(due) < new Date() ? true : false; }

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="full-loader">
      <div className="spinner" />
      <span style={{ color: '#5a5a7a', fontSize: 14 }}>Loading dashboard...</span>
    </div>
  );

  const { stats, myTasks = [], recentTasks = [], projects = [] } = data || {};

  return (
    <div className="page animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            Good {getTimeGreeting()}, <span style={{ color: '#a3e635' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="page-subtitle">Here's what's happening across your workspace</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          + New Project
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {STAT_CONFIGS.map(cfg => (
          <div key={cfg.key} className="card card-sm" style={{ borderLeft: `3px solid ${cfg.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {cfg.label}
              </span>
              <span style={{
                width: 32, height: 32, borderRadius: 8, background: cfg.bg,
                color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontFamily: 'Space Mono, monospace',
              }}>{cfg.icon}</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
              {stats?.[cfg.key] || 0}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* My Tasks */}
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>My Tasks</h2>
            <span style={{ fontSize: 13, color: '#9090b0' }}>{myTasks.length} pending</span>
          </div>
          {myTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: '#5a5a7a' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14 }}>No tasks assigned to you</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myTasks.map(task => (
                <div key={task.id} className="card card-sm" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <PriorityDot priority={task.priority} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{task.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={task.status} />
                      <Link to={`/projects/${task.project_id}`} style={{ fontSize: 12, color: '#60a5fa' }}>
                        {task.project_name}
                      </Link>
                      {task.due_date && (
                        <span style={{ fontSize: 11, color: isOverdue(task.due_date) ? '#f87171' : '#9090b0', fontFamily: 'Space Mono, monospace' }}>
                          {isOverdue(task.due_date) ? '⚠ ' : ''}Due {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects Overview */}
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Projects</h2>
            <Link to="/projects" style={{ fontSize: 13, color: '#a3e635', textDecoration: 'none' }}>View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px', color: '#5a5a7a' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>◈</div>
              <div style={{ fontSize: 14 }}>No projects yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.map(p => {
                const total = parseInt(p.total_tasks) || 0;
                const done = parseInt(p.done_tasks) || 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card card-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="flex-between">
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                        <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: '#9090b0' }}>
                          {done}/{total}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9090b0' }}>
                        <span>{pct}% complete</span>
                        {p.overdue_tasks > 0 && (
                          <span style={{ color: '#f87171' }}>⚠ {p.overdue_tasks} overdue</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {recentTasks.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Tasks</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#1e1e35', borderRadius: 12, overflow: 'hidden' }}>
            {recentTasks.map((task, i) => (
              <div key={task.id} style={{
                background: '#0e0e1c', padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <PriorityDot priority={task.priority} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</span>
                  <span style={{ fontSize: 12, color: '#9090b0', marginLeft: 10 }}>in {task.project_name}</span>
                </div>
                <StatusBadge status={task.status} />
                {task.assigned_to_name && (
                  <span style={{ fontSize: 12, color: '#9090b0' }}>{task.assigned_to_name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
