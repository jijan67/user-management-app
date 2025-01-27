const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

let connection = null;

async function connectDB() {
  const dbType = process.env.DB_TYPE || 'mysql';

  try {
    if (dbType === 'mysql') {
      // MySQL Connection
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
    } else {
      // PostgreSQL Connection
      connection = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false  // Only for Render's PostgreSQL
        }
      });

      await connection.connect();
      console.log('PostgreSQL connected successfully');
    }

    return connection;
  } catch (error) {
    console.error('Database Connection Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      dbType: dbType
    });
    throw error;
  }
}

async function initializeDatabase() {
  try {
    const dbType = process.env.DB_TYPE || 'mysql';

    if (dbType === 'mysql') {
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
    } else {
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
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database Initialization Error:', {
      message: error.message,
      stack: error.stack
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
