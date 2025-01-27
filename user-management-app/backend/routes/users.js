const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
        [name, email, hashedPassword]
      );
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get all users
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, status, last_login, registration_time FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving users' });
  }
});

// Bulk user actions
router.post('/bulk-action', authMiddleware, async (req, res) => {
  try {
    const { userIds, action } = req.body;

    if (!userIds || !action) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    switch (action) {
      case 'block':
        await pool.query('UPDATE users SET status = "blocked" WHERE id IN (?)', [userIds]);
        break;
      case 'unblock':
        await pool.query('UPDATE users SET status = "active" WHERE id IN (?)', [userIds]);
        break;
      case 'delete':
        await pool.query('DELETE FROM users WHERE id IN (?)', [userIds]);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ message: `Users ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Server error performing bulk action' });
  }
});

module.exports = router;
