const mysql = require('mysql2/promise');
require('dotenv').config();

let connection;

const connectDB = async () => {
  const connectionConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'user_management',
    connectTimeout: 10000, // 10 seconds
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  try {
    console.log('Attempting to connect to MySQL with config:', {
      host: connectionConfig.host,
      user: connectionConfig.user,
      database: connectionConfig.database
    });

    connection = await mysql.createConnection(connectionConfig);
    
    // Verify connection by running a simple query
    await connection.execute('SELECT 1');
    
    console.log('MySQL connected successfully');
    return connection;
  } catch (error) {
    console.error('MySQL Connection Error Details:');
    console.error('Full Error Object:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Connection Config:', {
      host: connectionConfig.host,
      user: connectionConfig.user,
      database: connectionConfig.database
    });
    console.error('Possible causes:');
    console.error('1. Incorrect password');
    console.error('2. Database does not exist');
    console.error('3. MySQL server not running');
    console.error('4. User does not have access to the database');
    throw error;
  }
};

// Function to create tables and unique index
async function initializeDatabase() {
  try {
    if (!connection) {
      throw new Error('No database connection available');
    }

    // Verify the users table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );

    if (tables.length === 0) {
      console.warn('Users table does not exist. Creating table...');
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          status ENUM('active', 'blocked') DEFAULT 'active',
          last_login DATETIME,
          registration_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
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
