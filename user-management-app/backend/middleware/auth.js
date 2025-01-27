const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query('SELECT * FROM users WHERE id = ? AND status != "blocked"', [decoded.userId]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or account blocked' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
