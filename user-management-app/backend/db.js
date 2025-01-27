const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

let connection = null;

async function connectDB() {
  try {
    // Prioritize PostgreSQL connection
    if (process.env.DATABASE_URL) {
      connection = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false  // Required for Render's PostgreSQL
        }
      });

      await connection.connect();
      console.log('PostgreSQL connected successfully');
    } else {
      // Fallback to MySQL if no DATABASE_URL
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

      // Verify connection by running a simple query
      await connection.execute('SELECT 1');
      
      console.log('MySQL connected successfully');
    }

    return connection;
  } catch (error) {
    console.error('Detailed Database Connection Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Not Set'
    });
    throw error;
  }
}

async function initializeDatabase() {
  try {
    // Determine database type based on connection
    const isPostgres = !!process.env.DATABASE_URL;

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
      isPostgres: !!process.env.DATABASE_URL
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
