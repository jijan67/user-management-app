const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { connectDB, initializeDatabase } = require('../db');

const router = express.Router();

// Middleware to parse request body
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Middleware to log route access
router.use((req, res, next) => {
  console.log(`[UserRoutes] ${req.method} ${req.path}`);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Middleware to normalize request body
router.use((req, res, next) => {
  // For x-www-form-urlencoded requests
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    const normalizedBody = {};
    for (const [key, value] of Object.entries(req.body)) {
      // Check if the key looks like an email
      if (key.includes('@')) {
        normalizedBody.email = key;
        normalizedBody.password = value;
      } else {
        normalizedBody[key] = value;
      }
    }
    req.body = normalizedBody;
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Normalized Request Details:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Middleware to log incoming requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Full Request Details:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Error Handling Middleware
router.use((error, req, res, next) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    requestBody: req.body
  });
  res.status(500).json({ message: error.message || 'Server error' });
});

// User Registration
router.post('/register', async (req, res, next) => {
  try {
    console.log('Registration Request:', req.body);
    const { name, email, password } = req.body;
    
    console.log('Registration Attempt:', { 
      name, 
      email,
      passwordProvided: !!password,
      requestBody: req.body 
    });
    
    // Validate input
    if (!name || !email || !password) {
      console.warn('Registration attempt with incomplete data:', { name, email, password });
      return res.status(400).json({ 
        message: 'Registration failed', 
        details: !name ? 'Name is required' 
               : !email ? 'Email is required' 
               : 'Password is required' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('Registration attempt with invalid email:', email);
      return res.status(400).json({ 
        message: 'Registration failed', 
        details: 'Invalid email format' 
      });
    }

    // Validate password strength
    if (password.length < 6) {
      console.warn('Registration attempt with weak password');
      return res.status(400).json({ 
        message: 'Registration failed', 
        details: 'Password must be at least 6 characters long' 
      });
    }

    try {
      // Connect to database
      const connection = await connectDB();

      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT * FROM users WHERE email = ?', 
        [email]
      );

      if (existingUsers.length > 0) {
        console.warn(`Registration failed: Email ${email} already exists`);
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Attempt to create user
      const userId = await User.create(name, email, hashedPassword);

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      console.log('User registered successfully:', { userId, email });
      res.status(201).json({ 
        token, 
        user: { 
          id: userId, 
          name, 
          email,
          status: 'active'
        } 
      });
    } catch (createError) {
      console.error('User creation error:', {
        message: createError.message,
        stack: createError.stack,
        name: createError.name,
        code: createError.code
      });

      // Handle specific error cases
      if (createError.message.includes('Email already exists')) {
        return res.status(409).json({ 
          message: 'Registration failed', 
          details: 'Email is already registered' 
        });
      }

      // Generic error for other cases
      return res.status(500).json({ 
        message: 'Registration failed', 
        details: 'An unexpected error occurred' 
      });
    }
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestBody: req.body
    });
    next(error);
  }
});

// User Login
router.post('/login', async (req, res, next) => {
  try {
    console.log('Login Request:', req.body);
    const { email, password } = req.body;
    
    console.log('Login Attempt:', { 
      email, 
      passwordProvided: !!password,
      requestBody: req.body 
    });
    
    // Validate input
    if (!email) {
      console.warn('Login attempt without email');
      return res.status(400).json({ 
        message: 'Login failed', 
        details: 'Email is required' 
      });
    }

    if (!password || password.trim() === '') {
      console.warn('Login attempt with empty password', { email });
      return res.status(400).json({ 
        message: 'Login failed', 
        details: 'Password is required' 
      });
    }
    
    // Connect to database
    const connection = await connectDB();

    // Find user
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    if (users.length === 0) {
      console.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`Login failed: Invalid password - ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check user status
    if (user.status !== 'active') {
      console.warn(`Login failed: Inactive user - ${email}`);
      return res.status(403).json({ message: 'User account is not active' });
    }

    // Update last login
    await connection.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?', 
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '1h' }
    );

    console.log(`User logged in successfully: ${email}`);
    res.status(200).json({ 
      message: 'Login successful', 
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestBody: req.body
    });
    next(error);
  }
});

// Get All Users (Admin route)
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Update User Status (Admin route)
router.patch('/users/:email/status', async (req, res, next) => {
  try {
    console.log('Update User Status Request:', req.body);
    const { email } = req.params;
    const { status } = req.body;

    // Validate input
    if (!email || !status) {
      console.warn('Status update attempt with incomplete data:', { email, status });
      return res.status(400).json({ message: 'Email and status are required' });
    }

    // Connect to database
    const connection = await connectDB();

    // Update user status
    await connection.execute(
      'UPDATE users SET status = ? WHERE email = ?', 
      [status, email]
    );

    console.log('User status updated successfully:', { email, status });
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update User Status error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestBody: req.body
    });
    next(error);
  }
});

// Delete User (Admin functionality)
router.delete('/:id', async (req, res, next) => {
  try {
    console.log('Delete User Request:', req.params);
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestBody: req.body
    });
    next(error);
  }
});

// Error Handling Middleware
router.use((error, req, res, next) => {
  console.error('Unhandled Route Error:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    requestBody: req.body
  });
  res.status(500).json({ 
    message: 'Login failed',
    details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  });
});

module.exports = router;
