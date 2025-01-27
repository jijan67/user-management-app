const bcrypt = require('bcryptjs');
const { getConnection } = require('../db');

class User {
  // Utility method to validate and sanitize input
  static _validateInput(input, fieldName) {
    if (input === undefined || input === null || input.trim() === '') {
      throw new Error(`${fieldName} cannot be empty`);
    }
    return input.toString().trim();
  }

  static async create(name, email, password) {
    try {
      // Validate and sanitize inputs
      const sanitizedName = this._validateInput(name, 'Name');
      const sanitizedEmail = this._validateInput(email, 'Email');
      const sanitizedPassword = this._validateInput(password, 'Password');

      // Additional password validation
      if (sanitizedPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const connection = getConnection();
      const hashedPassword = await bcrypt.hash(sanitizedPassword, 10);
      
      const [result] = await connection.execute(
        'INSERT INTO users (name, email, password, status, registration_time) VALUES (?, ?, ?, ?, NOW())',
        [sanitizedName, sanitizedEmail, hashedPassword, 'active']
      );
      return result.insertId;
    } catch (error) {
      console.error('User creation error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      // Validate and sanitize email
      const sanitizedEmail = this._validateInput(email, 'Email');

      const connection = getConnection();
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [sanitizedEmail]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Find by email error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  }

  static async updateLastLogin(email) {
    try {
      // Validate and sanitize email
      const sanitizedEmail = this._validateInput(email, 'Email');

      const connection = getConnection();
      await connection.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?',
        [sanitizedEmail]
      );
    } catch (error) {
      console.error('Update last login error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  }

  static async updateStatus(email, status) {
    try {
      // Validate and sanitize inputs
      const sanitizedEmail = this._validateInput(email, 'Email');
      const sanitizedStatus = this._validateInput(status, 'Status');

      // Additional validation for status
      if (!['active', 'blocked'].includes(sanitizedStatus)) {
        throw new Error('Invalid status. Must be "active" or "blocked"');
      }

      const connection = getConnection();
      await connection.execute(
        'UPDATE users SET status = ? WHERE email = ?',
        [sanitizedStatus, sanitizedEmail]
      );
    } catch (error) {
      console.error('Update status error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  }

  static async getAllUsers() {
    try {
      const connection = getConnection();
      const [rows] = await connection.execute(
        'SELECT id, name, email, status, registration_time, last_login FROM users'
      );
      return rows;
    } catch (error) {
      console.error('Get all users error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  }

  static async comparePassword(candidatePassword, userPassword) {
    try {
      // Validate inputs
      const sanitizedCandidatePassword = this._validateInput(candidatePassword, 'Candidate Password');
      const sanitizedUserPassword = this._validateInput(userPassword, 'User Password');

      return await bcrypt.compare(sanitizedCandidatePassword, sanitizedUserPassword);
    } catch (error) {
      console.error('Password comparison error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  }
}

module.exports = User;
