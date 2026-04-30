const BASE = process.env.REACT_APP_API_URL || '';

const getToken = () => localStorage.getItem('token');

const req = async (method, path, body) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}/api${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  return data;
};

export const api = {
  // Auth
  signup: (d) => req('POST', '/auth/signup', d),
  login: (d) => req('POST', '/auth/login', d),
  me: () => req('GET', '/auth/me'),

  // Dashboard
  dashboard: () => req('GET', '/dashboard'),

  // Projects
  getProjects: () => req('GET', '/projects'),
  createProject: (d) => req('POST', '/projects', d),
  getProject: (id) => req('GET', `/projects/${id}`),
  updateProject: (id, d) => req('PUT', `/projects/${id}`, d),
  deleteProject: (id) => req('DELETE', `/projects/${id}`),
  addMember: (id, d) => req('POST', `/projects/${id}/members`, d),
  removeMember: (pid, uid) => req('DELETE', `/projects/${pid}/members/${uid}`),
  getMembers: (id) => req('GET', `/projects/${id}/members`),

  // Tasks
  getTasks: (pid, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req('GET', `/projects/${pid}/tasks${q ? '?' + q : ''}`);
  },
  createTask: (pid, d) => req('POST', `/projects/${pid}/tasks`, d),
  updateTask: (pid, tid, d) => req('PUT', `/projects/${pid}/tasks/${tid}`, d),
  deleteTask: (pid, tid) => req('DELETE', `/projects/${pid}/tasks/${tid}`),

  // Users
  getUsers: () => req('GET', '/users'),
  updateUserRole: (id, role) => req('PUT', `/users/${id}/role`, { role }),
};
