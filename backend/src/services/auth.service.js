import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database.js';
import { AppError } from '../errors/AppError.js';

class AuthService {
  constructor() {
    this.db = getDatabase();
  }

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
   * Admin login
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise<Object>} Admin user and token
   */
  async adminLogin(email, password) {
    try {
      // Find admin user
      const result = await this.db.query(
        'SELECT * FROM admins WHERE email = $1 LIMIT 1',
        [email]
      );
      
      const admin = result.rows[0];
      
      if (!admin) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isValid = await bcrypt.compare(password, admin.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if active
      if (!admin.is_active) {
        throw new AppError('Account is inactive', 403);
      }

      // Update last login
      await this.db.query(
        'UPDATE admins SET last_login = NOW() WHERE id = $1',
        [admin.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email,
          role: 'admin',
          permissions: admin.permissions
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '8h' }
      );

      delete admin.password_hash;

      return {
        success: true,
        data: {
          user: admin,
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Admin login failed', 500, error.message);
    }
  }

  /**
   * Provider login
   * @param {string} email - Provider email
   * @param {string} password - Provider password
   * @returns {Promise<Object>} Provider user and token
   */
  async providerLogin(email, password) {
    try {
      // Find provider
      const result = await this.db.query(
        'SELECT * FROM providers WHERE email = $1 LIMIT 1',
        [email]
      );
      
      const provider = result.rows[0];
      
      if (!provider) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isValid = await bcrypt.compare(password, provider.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if active
      if (provider.status !== 'active') {
        throw new AppError('Account is not active', 403);
      }

      // Update last login
      await this.db.query(
        'UPDATE providers SET last_login = NOW() WHERE id = $1',
        [provider.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: provider.id, 
          email: provider.email,
          role: 'provider',
          license_number: provider.license_number
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '12h' }
      );

      delete provider.password_hash;

      return {
        success: true,
        data: {
          user: provider,
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Provider login failed', 500, error.message);
    }
  }

  /**
   * Patient login
   * @param {string} email - Patient email
   * @param {string} password - Patient password
   * @returns {Promise<Object>} Patient user and token
   */
  async patientLogin(email, password) {
    try {
      // Find patient
      const result = await this.db.query(
        'SELECT * FROM patients WHERE email = $1 LIMIT 1',
        [email]
      );
      
      const patient = result.rows[0];
      
      if (!patient) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isValid = await bcrypt.compare(password, patient.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if active
      if (!patient.is_active) {
        throw new AppError('Account is inactive', 403);
      }

      // Update last login
      await this.db.query(
        'UPDATE patients SET last_login = NOW() WHERE id = $1',
        [patient.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: patient.id, 
          email: patient.email,
          role: 'patient',
          subscription_tier: patient.subscription_tier
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      delete patient.password_hash;

      return {
        success: true,
        data: {
          user: patient,
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Patient login failed', 500, error.message);
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
      
      const result = await this.db.query(query, [email]);
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

    try {
      await this.db.query('BEGIN');

      // Insert into users table
      const userQuery = `
        INSERT INTO users (email, password, role)
        VALUES ($1, $2, $3)
        RETURNING id, email, role, created_at
      `;
      const userResult = await this.db.query(userQuery, [email, password, role]);
      const user = userResult.rows[0];

      // Insert into role-specific table
      if (role === 'patient') {
        const patientQuery = `
          INSERT INTO patients (user_id, first_name, last_name, phone, date_of_birth)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await this.db.query(patientQuery, [user.id, firstName, lastName, phone, dateOfBirth]);
      } else if (role === 'provider') {
        const providerQuery = `
          INSERT INTO providers (user_id, first_name, last_name, phone, license_number)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await this.db.query(providerQuery, [user.id, firstName, lastName, phone, '']);
      }

      await this.db.query('COMMIT');

      return {
        ...user,
        firstName,
        lastName,
        phone,
        dateOfBirth
      };
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   */
  async updateLastLogin(userId) {
    try {
      const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
      await this.db.query(query, [userId]);
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
    const { password, password_hash, ...sanitizedUser } = user;
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
      const result = await this.db.query(query, [userId]);
      
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
      await this.db.query(updateQuery, [hashedPassword, userId]);

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Password change failed', 500, error.message);
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetPassword(token, newPassword) {
    try {
      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password based on user role
      let updateQuery;
      switch (decoded.role) {
        case 'admin':
          updateQuery = 'UPDATE admins SET password_hash = $1 WHERE id = $2';
          break;
        case 'provider':
          updateQuery = 'UPDATE providers SET password_hash = $1 WHERE id = $2';
          break;
        case 'patient':
          updateQuery = 'UPDATE patients SET password_hash = $1 WHERE id = $2';
          break;
        default:
          throw new AppError('Invalid user role', 400);
      }

      await this.db.query(updateQuery, [hashedPassword, decoded.id]);

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Password reset failed', 500, error.message);
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @param {string} role - User role
   * @returns {Promise<string>} Reset token
   */
  async requestPasswordReset(email, role) {
    try {
      // Find user based on role
      let query;
      switch (role) {
        case 'admin':
          query = 'SELECT id, email FROM admins WHERE email = $1';
          break;
        case 'provider':
          query = 'SELECT id, email FROM providers WHERE email = $1';
          break;
        case 'patient':
          query = 'SELECT id, email FROM patients WHERE email = $1';
          break;
        default:
          throw new AppError('Invalid user role', 400);
      }

      const result = await this.db.query(query, [email]);
      const user = result.rows[0];

      if (!user) {
        // Don't reveal if email exists
        return { message: 'If the email exists, a reset link will be sent' };
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id, email: user.email, role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // TODO: Send email with reset token
      // This would typically integrate with an email service

      return { token: resetToken, message: 'Reset token generated' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Password reset request failed', 500, error.message);
    }
  }
}

export default AuthService;
