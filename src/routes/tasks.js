const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });
router.use(authenticate);
router.use(requireProjectAccess);

const taskValidation = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  body('assigned_to').optional({ nullable: true }).isInt(),
];

// GET /api/projects/:projectId/tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, assigned_to } = req.query;
    let conditions = ['t.project_id = $1'];
    let params = [req.params.projectId];
    let i = 2;

    if (status) { conditions.push(`t.status = $${i++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${i++}`); params.push(priority); }
    if (assigned_to) { conditions.push(`t.assigned_to = $${i++}`); params.push(assigned_to); }

    const { rows } = await pool.query(`
      SELECT t.*,
        u1.name AS assigned_to_name, u1.email AS assigned_to_email,
        u2.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        t.due_date NULLS LAST, t.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:projectId/tasks
router.post('/', taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description = '', status = 'todo', priority = 'medium', due_date, assigned_to } = req.body;
  try {
    if (assigned_to) {
      const check = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.params.projectId, assigned_to]
      );
      if (!check.rows.length) return res.status(400).json({ error: 'Assigned user is not a project member' });
    }

    const { rows } = await pool.query(`
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [req.params.projectId, title, description, status, priority, due_date || null, assigned_to || null, req.user.id]);

    const full = await pool.query(`
      SELECT t.*, u1.name AS assigned_to_name, u2.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [rows[0].id]);

    res.status(201).json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:projectId/tasks/:taskId
router.put('/:taskId', taskValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status, priority, due_date, assigned_to } = req.body;
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [req.params.taskId, req.params.projectId]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

    const canEdit = req.user.role === 'admin' || req.projectRole === 'admin' || task.rows[0].assigned_to === req.user.id || task.rows[0].created_by === req.user.id;
    if (!canEdit) return res.status(403).json({ error: 'Cannot edit this task' });

    if (assigned_to) {
      const check = await pool.query('SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, assigned_to]);
      if (!check.rows.length) return res.status(400).json({ error: 'Assigned user is not a project member' });
    }

    const { rows } = await pool.query(`
      UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        due_date = $5,
        assigned_to = $6
      WHERE id = $7 AND project_id = $8 RETURNING *
    `, [title, description, status, priority, due_date || null, assigned_to || null, req.params.taskId, req.params.projectId]);

    const full = await pool.query(`
      SELECT t.*, u1.name AS assigned_to_name, u2.name AS created_by_name
      FROM tasks t LEFT JOIN users u1 ON t.assigned_to = u1.id LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [rows[0].id]);

    res.json(full.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:projectId/tasks/:taskId
router.delete('/:taskId', async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1 AND project_id = $2', [req.params.taskId, req.params.projectId]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

    const canDelete = req.user.role === 'admin' || req.projectRole === 'admin' || task.rows[0].created_by === req.user.id;
    if (!canDelete) return res.status(403).json({ error: 'Cannot delete this task' });

    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.taskId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
