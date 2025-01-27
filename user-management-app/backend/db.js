const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

let connection = null;

// Log all environment variables for debugging
function logEnvironmentVariables() {
  console.log('Environment Variables:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
  console.log('MYSQL_USER:', process.env.MYSQL_USER);
  console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
  
  // Log all environment variables for comprehensive debugging
  Object.keys(process.env).forEach(key => {
    if (key.includes('DB') || key.includes('MYSQL') || key.includes('DATABASE')) {
      console.log(`${key}:`, process.env[key]);
    }
  });
}

async function connectDB() {
  // Log environment variables before attempting connection
  logEnvironmentVariables();

  try {
    // Prioritize PostgreSQL connection
    if (process.env.DATABASE_URL) {
      try {
        connection = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false  // Required for Render's PostgreSQL
          }
        });

        await connection.connect();
        console.log('PostgreSQL connected successfully');
        return connection;
      } catch (postgresError) {
        console.error('PostgreSQL Connection Failed:', {
          message: postgresError.message,
          stack: postgresError.stack
        });
      }
    }

    // Fallback to MySQL if no DATABASE_URL or PostgreSQL connection fails
    try {
      connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'user_management',
        port: process.env.MYSQL_PORT || 3306,
        connectTimeout: 10000, // 10 seconds
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      await connection.execute('SELECT 1');
      console.log('MySQL connected successfully');
      return connection;
    } catch (mysqlError) {
      console.error('MySQL Connection Failed:', {
        message: mysqlError.message,
        stack: mysqlError.stack
      });
    }

    // If both PostgreSQL and MySQL fail, throw a comprehensive error
    throw new Error('Unable to establish database connection. Please check your configuration.');
  } catch (error) {
    console.error('Comprehensive Database Connection Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Not Set',
      mysqlHost: process.env.MYSQL_HOST,
      mysqlUser: process.env.MYSQL_USER,
      mysqlDatabase: process.env.MYSQL_DATABASE
    });
    throw error;
  }
}

async function initializeDatabase() {
  try {
    if (!connection) {
      throw new Error('No database connection available. Please check your database configuration.');
    }

    // Determine database type based on connection
    const isPostgres = connection instanceof Pool;

    if (isPostgres) {
      // PostgreSQL Table Creation
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL
        )
      `);
      console.log('PostgreSQL users table initialized');
    } else {
      // MySQL Table Creation
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          status ENUM('active', 'blocked') DEFAULT 'active',
          registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL
        )
      `);
      console.log('MySQL users table initialized');
    }
  } catch (error) {
    console.error('Database Initialization Error:', {
      message: error.message,
      stack: error.stack,
      isPostgres: connection instanceof Pool
    });
    throw error;
  }
}

module.exports = {
  connectDB,
  initializeDatabase,
  getConnection: () => {
    if (!connection) {
      throw new Error('Database connection not established');
    }
    return connection;
  }
};
