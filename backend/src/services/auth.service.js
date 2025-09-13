const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { AppError } = require('../errors/AppError');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and token
   */
  async register(userData) {
    const { email, password, role, firstName, lastName, phone, dateOfBirth } = userData;

    try {
      // Check if user already exists
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user based on role
      const user = await this.createUser({
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        phone,
        dateOfBirth
      });

      // Generate token
      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Registration failed', 500, error.message);
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    try {
      // Find user
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Generate token
      const token = this.generateToken(user);

      return {
        user: this.sanitizeUser(user),
        token
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Login failed', 500, error.message);
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByEmail(email) {
    try {
      const query = `
        SELECT 
          u.id, u.email, u.password, u.role, u.created_at,
          p.first_name, p.last_name, p.phone, p.date_of_birth,
          pr.license_number, pr.specialty
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
        LEFT JOIN providers pr ON u.id = pr.user_id AND u.role = 'provider'
        WHERE u.email = $1
      `;
      
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new AppError('Database query failed', 500, error.message);
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const { email, password, role, firstName, lastName, phone, dateOfBirth } = userData;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert into users table
      const userQuery = `
        INSERT INTO users (email, password, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role, created_at
      `;
      const userResult = await client.query(userQuery, [email, password, role]);
      const user = userResult.rows[0];

      // Insert into role-specific table
      if (role === 'patient') {
        const patientQuery = `
          INSERT INTO patients (user_id, first_name, last_name, phone, date_of_birth)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(patientQuery, [user.id, firstName, lastName, phone, dateOfBirth]);
      } else if (role === 'provider') {
        const providerQuery = `
          INSERT INTO providers (user_id, first_name, last_name, phone, license_number)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(providerQuery, [user.id, firstName, lastName, phone, '']);
      }

      await client.query('COMMIT');

      return {
        ...user,
        firstName,
        lastName,
        phone,
        dateOfBirth
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   */
  async updateLastLogin(userId) {
    try {
      const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
      await pool.query(query, [userId]);
    } catch (error) {
      console.error('Failed to update last login:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      throw new AppError('Invalid token', 401);
    }
  }

  /**
   * Remove sensitive data from user object
   * @param {Object} user - User object
   * @returns {Object} Sanitized user object
   */
  sanitizeUser(user) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get user
      const query = 'SELECT password FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);
      
      if (!result.rows[0]) {
        throw new AppError('User not found', 404);
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, result.rows[0].password);
      if (!isValid) {
        throw new AppError('Invalid current password', 401);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateQuery = 'UPDATE users SET password = $1 WHERE id = $2';
      await pool.query(updateQuery, [hashedPassword, userId]);

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Password change failed', 500, error.message);
    }
  }
}

module.exports = new AuthService();
