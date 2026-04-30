const express = require('express');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const projectFilter = isAdmin
      ? 'TRUE'
      : `p.id IN (SELECT project_id FROM project_members WHERE user_id = ${userId})`;

    const taskFilter = isAdmin
      ? 'TRUE'
      : `t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ${userId})`;

    // Summary stats
    const stats = await pool.query(`
      SELECT
        COUNT(DISTINCT p.id) AS total_projects,
        COUNT(DISTINCT t.id) AS total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'todo' THEN t.id END) AS todo_count,
        COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) AS in_progress_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_count,
        COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN t.id END) AS overdue_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE ${projectFilter}
    `);

    // My tasks (assigned to me)
    const myTasks = await pool.query(`
      SELECT t.*, p.name AS project_name, u.name AS assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = $1 AND t.status != 'done'
      ORDER BY
        CASE WHEN t.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
        t.due_date NULLS LAST,
        CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      LIMIT 10
    `, [userId]);

    // Recent activity - recently updated tasks
    const recentTasks = await pool.query(`
      SELECT t.*, p.name AS project_name, u.name AS assigned_to_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE ${taskFilter.replace(/\bt\b/g, 't')}
      ORDER BY t.created_at DESC LIMIT 8
    `);

    // Projects with progress
    const projects = await pool.query(`
      SELECT p.id, p.name, p.description,
        COUNT(t.id) AS total_tasks,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS done_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress_tasks,
        COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) AS overdue_tasks
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE ${projectFilter}
      GROUP BY p.id ORDER BY p.created_at DESC LIMIT 6
    `);

    res.json({
      stats: stats.rows[0],
      myTasks: myTasks.rows,
      recentTasks: recentTasks.rows,
      projects: projects.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
