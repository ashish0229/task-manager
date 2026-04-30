const express = require('express');
const { pool } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users - admin sees all, members see themselves
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { rows } = await pool.query(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
      );
      return res.json(rows);
    }
    res.json([req.user]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/:id/role - admin only
router.put('/:id/role', requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
