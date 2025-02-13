// Explicit environment configuration
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env' 
});

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, initializeDatabase } = require('./db');
const userRoutes = require('./routes/userRoutes');

// Log environment variables at the very start
console.log('STARTUP ENVIRONMENT VARIABLES:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  MYSQL_HOST: process.env.MYSQL_HOST,
  MYSQL_USER: process.env.MYSQL_USER,
  MYSQL_DATABASE: process.env.MYSQL_DATABASE
});

const app = express();

// Comprehensive CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://user-management-app-zk5i.onrender.com',
  /\.onrender\.com$/
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS Origin Check:', origin);
    if (!origin || ALLOWED_ORIGINS.some(allowedOrigin => 
      typeof allowedOrigin === 'string' 
        ? origin === allowedOrigin 
        : allowedOrigin.test(origin)
    )) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware for detailed logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware
app.use((req, res, next) => {
  // Trust Render's proxy
  req.secure = req.headers['x-forwarded-proto'] === 'https';
  next();
});

// Advanced body parsing middleware
app.use((req, res, next) => {
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsedBody = {};
        body.split('&').forEach(part => {
          const [key, value] = part.split('=').map(decodeURIComponent);
          if (key) {
            parsedBody[key] = value || '';
          }
        });

        // Special handling for registration
        if (Object.keys(parsedBody).length === 1 && Object.keys(parsedBody)[0].includes('@')) {
          const email = Object.keys(parsedBody)[0];
          parsedBody.email = email;
          delete parsedBody[email];
        }

        req.body = parsedBody;
        next();
      } catch (error) {
        console.error('Body parsing error:', error);
        next(error);
      }
    });
  } else {
    bodyParser.json()(req, res, next);
  }
});

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Headers:', req.headers);
  console.log('Request Origin:', req.get('origin'));
  next();
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Details:', {
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Root health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      databaseConfigured: !!process.env.DATABASE_URL
    }
  });
});

// Explicit API prefix
app.use('/api/auth', userRoutes);

// Connect to MySQL and initialize database
const startServer = async () => {
  try {
    // Attempt to connect to the database with multiple fallbacks
    let connection = null;
    
    // Try MySQL first
    if (process.env.DATABASE_URL) {
      try {
        connection = await connectDB();
        console.log('MySQL connection successful');
      } catch (mysqlError) {
        console.error('MySQL Connection Failed:', mysqlError);
      }
    }
    
    // If no database connection, log a critical error
    if (!connection) {
      console.error('CRITICAL: Unable to establish database connection');
      console.error('Environment Details:', {
        databaseUrl: process.env.DATABASE_URL,
        mysqlHost: process.env.MYSQL_HOST,
        mysqlUser: process.env.MYSQL_USER,
        mysqlDatabase: process.env.MYSQL_DATABASE
      });
      
      // In production, we might want to exit the process
      if (process.env.NODE_ENV === 'production') {
        console.error('Exiting due to database connection failure');
        process.exit(1);
      }
    }
    
    // Initialize database tables
    await initializeDatabase();

    // Authentication Routes
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        try {
          const [result] = await connection.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
            [name, email, hashedPassword]
          );
          
          res.status(201).json({ message: 'User registered successfully' });
        } catch (dbError) {
          if (dbError.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
          }
          throw dbError;
        }
      } catch (error) {
        console.error('Registration Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        });
        res.status(500).json({ message: 'Registration failed', error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' });
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Update last login
        await connection.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        const token = jwt.sign(
          { id: user.id, email: user.email }, 
          process.env.JWT_SECRET, 
          { expiresIn: '1h' }
        );
        
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email,
            status: user.status
          } 
        });
      } catch (error) {
        console.error('Login Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        });
        res.status(500).json({ message: 'Login failed', error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' });
      }
    });

    // Authentication Middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token == null) return res.sendStatus(401);

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
      });
    };

    // User Management Routes
    app.get('/api/users', authenticateToken, async (req, res) => {
      try {
        const [users] = await connection.execute('SELECT id, name, email, status, last_login, registration_time FROM users');
        res.json({ data: users });
      } catch (error) {
        console.error('User Fetch Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        });
        res.status(500).json({ message: 'Failed to fetch users', error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' });
      }
    });

    app.post('/api/users/bulk-action', authenticateToken, async (req, res) => {
      try {
        const { userIds, action } = req.body;
        
        const placeholders = userIds.map(() => '?').join(',');
        
        switch(action) {
          case 'block':
            await connection.execute(`UPDATE users SET status = 'blocked' WHERE id IN (${placeholders})`, userIds);
            break;
          case 'unblock':
            await connection.execute(`UPDATE users SET status = 'active' WHERE id IN (${placeholders})`, userIds);
            break;
          case 'delete':
            await connection.execute(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);
            break;
          default:
            return res.status(400).json({ message: 'Invalid action' });
        }
        
        res.json({ message: `Users ${action}ed successfully` });
      } catch (error) {
        console.error('Bulk Action Error:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code
        });
        res.status(500).json({ message: `Failed to ${action} users`, error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' });
      }
    });

    // Routes
    app.use('/api/users', userRoutes);

    // Serve static files from the React app in production
    if (process.env.NODE_ENV === 'production') {
      const frontendPath = path.join(__dirname, '../frontend/build');
      
      // Serve static files
      app.use(express.static(frontendPath));

      // Catch-all route to serve index.html for client-side routing
      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
      });
    }

    // Catch-all route for debugging
    app.use((req, res) => {
      console.warn(`Unhandled route: ${req.method} ${req.path}`);
      res.status(404).json({
        message: 'Route Not Found',
        path: req.path,
        method: req.method
      });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Unhandled Error:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : err.message
      });
    });

    // Start the server
    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Listening on all network interfaces`);
      console.log(`Database connection established successfully`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      sqlState: error.sqlState
    });
    process.exit(1);
  }
};

// Start the server
startServer();
