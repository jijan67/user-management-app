const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

let connection = null;

// Validate database URL
function validateDatabaseUrl(url) {
  if (!url || url.includes('${') || url.trim() === '') {
    console.error('Invalid DATABASE_URL:', url);
    return false;
  }
  return true;
}

async function connectDB() {
  console.log('Attempting to connect to database...');
  console.log('Environment Variables:', {
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE
  });

  try {
    // Prioritize PostgreSQL connection
    if (validateDatabaseUrl(process.env.DATABASE_URL)) {
      try {
        connection = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false  // Required for Render's PostgreSQL
          }
        });

        // Test the connection
        const client = await connection.connect();
        console.log('PostgreSQL connection successful');
        client.release();
        return connection;
      } catch (postgresError) {
        console.error('PostgreSQL Connection Failed:', {
          message: postgresError.message,
          name: postgresError.name,
          code: postgresError.code,
          stack: postgresError.stack
        });
      }
    }

    // Fallback to MySQL if PostgreSQL fails
    try {
      connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'user_management',
        port: parseInt(process.env.MYSQL_PORT || '3306', 10)
      });

      await connection.execute('SELECT 1');
      console.log('MySQL connection successful');
      return connection;
    } catch (mysqlError) {
      console.error('MySQL Connection Failed:', {
        message: mysqlError.message,
        name: mysqlError.name,
        code: mysqlError.code,
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
  initializeDatabase
};
