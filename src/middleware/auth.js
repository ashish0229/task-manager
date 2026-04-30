const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireProjectAccess = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  if (req.user.role === 'admin') return next();

  const { rows } = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (!rows.length) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  req.projectRole = rows[0].role;
  next();
};

const requireProjectAdmin = async (req, res, next) => {
  const projectId = req.params.projectId || req.params.id;
  const userId = req.user.id;

  if (req.user.role === 'admin') return next();

  const { rows } = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (!rows.length || rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Project admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireProjectAccess, requireProjectAdmin };
