const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects - List all accessible projects
router.get('/', async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `
        SELECT p.*, u.name AS owner_name,
          COUNT(DISTINCT pm.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, u.name ORDER BY p.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT p.*, u.name AS owner_name,
          COUNT(DISTINCT pm2.user_id) AS member_count,
          COUNT(DISTINCT t.id) AS task_count,
          pm.role AS my_role
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm2 ON pm2.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, u.name, pm.role ORDER BY p.created_at DESC
      `;
      params = [req.user.id];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects - Create project (admin only at system level, or any user creates and becomes admin)
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Name required (2-200 chars)'),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description = '' } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/projects/:id - Single project details
router.get('/:id', requireProjectAccess, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name AS owner_name FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.query(`
      SELECT u.id, u.name, u.email, u.role AS system_role, pm.role AS project_role, pm.joined_at
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1 ORDER BY pm.joined_at
    `, [req.params.id]);

    res.json({ ...rows[0], members: members.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 2, max: 200 }),
  body('description').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description)
      WHERE id = $3 RETURNING *
    `, [name, description, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', requireProjectAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members - Add member
router.post('/:id/members', requireProjectAdmin, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role = 'member' } = req.body;
  try {
    const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    const u = user.rows[0];
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3',
      [req.params.id, u.id, role]
    );
    res.status(201).json({ ...u, project_role: role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', requireProjectAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/projects/:id/members - List all users (for assignment dropdown)
router.get('/:id/members', requireProjectAccess, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role AS project_role
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1 ORDER BY u.name
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
