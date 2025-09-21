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
      await this.updateLastLogin(user.id, user.role);

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
      // Find admin user - fix table name to match our schema
      const result = await this.db`
        SELECT * FROM admin_users WHERE email = ${email} LIMIT 1
      `;
      
      const admin = result[0];
      
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
      await this.db`
        UPDATE admin_users SET last_login = NOW() WHERE id = ${admin.id}
      `;

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
      // Find provider - use postgres template literals
      const result = await this.db`
        SELECT * FROM providers WHERE email = ${email} LIMIT 1
      `;
      
      const provider = result[0];
      
      if (!provider) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check password
      const isValid = await bcrypt.compare(password, provider.password_hash);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if active - fix field name to match our schema
      if (!provider.is_active) {
        throw new AppError('Account is not active', 403);
      }

      // Update last login
      await this.db`
        UPDATE providers SET last_login = NOW() WHERE id = ${provider.id}
      `;

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
      // Find patient - use postgres template literals
      const result = await this.db`
        SELECT * FROM patients WHERE email = ${email} LIMIT 1
      `;
      
      const patient = result[0];
      
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
      await this.db`
        UPDATE patients SET last_login = NOW() WHERE id = ${patient.id}
      `;

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
   * Find user by email across all user tables
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  async findUserByEmail(email) {
    try {
      // Check patients table
      let result = await this.db`
        SELECT 
          id, email, password_hash as password, first_name, last_name, 
          phone, date_of_birth, created_at, 'patient' as role,
          subscription_tier, is_active
        FROM patients 
        WHERE email = ${email}
        LIMIT 1
      `;
      
      if (result.length > 0) {
        return result[0];
      }

      // Check providers table
      result = await this.db`
        SELECT 
          id, email, password_hash as password, first_name, last_name, 
          phone, license_number, created_at, 'provider' as role,
          is_active
        FROM providers 
        WHERE email = ${email}
        LIMIT 1
      `;
      
      if (result.length > 0) {
        return result[0];
      }

      // Check admin_users table
      result = await this.db`
        SELECT 
          id, email, password_hash as password, first_name, last_name, 
          role, permissions, created_at, is_active
        FROM admin_users 
        WHERE email = ${email}
        LIMIT 1
      `;
      
      if (result.length > 0) {
        return result[0];
      }

      return null;
    } catch (error) {
      throw new AppError('Database query failed', 500, error.message);
    }
  }

  /**
   * Create a new user in the appropriate table based on role
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    const { email, password, role, firstName, lastName, phone, dateOfBirth } = userData;

    try {
      const createdAt = new Date();
      let result;

      // Insert directly into role-specific table
      if (role === 'patient') {
        result = await this.db`
          INSERT INTO patients (
            email, password_hash, first_name, last_name, phone, date_of_birth, created_at
          ) VALUES (
            ${email}, ${password}, ${firstName}, ${lastName}, ${phone}, ${dateOfBirth}, ${createdAt}
          )
          RETURNING id, email, first_name, last_name, phone, date_of_birth, created_at
        `;
      } else if (role === 'provider') {
        result = await this.db`
          INSERT INTO providers (
            email, password_hash, first_name, last_name, phone, created_at
          ) VALUES (
            ${email}, ${password}, ${firstName}, ${lastName}, ${phone}, ${createdAt}
          )
          RETURNING id, email, first_name, last_name, phone, created_at
        `;
      } else if (role === 'admin') {
        result = await this.db`
          INSERT INTO admin_users (
            email, password_hash, first_name, last_name, role, created_at
          ) VALUES (
            ${email}, ${password}, ${firstName}, ${lastName}, ${role}, ${createdAt}
          )
          RETURNING id, email, first_name, last_name, role, created_at
        `;
      } else {
        throw new AppError('Invalid user role', 400);
      }

      const user = result[0];
      return {
        ...user,
        role,
        firstName: user.first_name,
        lastName: user.last_name,
        phone,
        dateOfBirth
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('User creation failed', 500, error.message);
    }
  }

  /**
   * Update user's last login timestamp in appropriate table
   * @param {string} userId - User ID
   * @param {string} role - User role to determine which table to update
   */
  async updateLastLogin(userId, role) {
    try {
      const lastLogin = new Date();
      
      if (role === 'patient') {
        await this.db`UPDATE patients SET last_login = ${lastLogin} WHERE id = ${userId}`;
      } else if (role === 'provider') {
        await this.db`UPDATE providers SET last_login = ${lastLogin} WHERE id = ${userId}`;
      } else if (role === 'admin') {
        await this.db`UPDATE admin_users SET last_login = ${lastLogin} WHERE id = ${userId}`;
      }
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
   * Change user password in appropriate table
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, role, oldPassword, newPassword) {
    try {
      let currentPasswordHash;
      
      // Get current password based on role
      if (role === 'patient') {
        const result = await this.db`SELECT password_hash FROM patients WHERE id = ${userId}`;
        currentPasswordHash = result[0]?.password_hash;
      } else if (role === 'provider') {
        const result = await this.db`SELECT password_hash FROM providers WHERE id = ${userId}`;
        currentPasswordHash = result[0]?.password_hash;
      } else if (role === 'admin') {
        const result = await this.db`SELECT password_hash FROM admin_users WHERE id = ${userId}`;
        currentPasswordHash = result[0]?.password_hash;
      }

      if (!currentPasswordHash) {
        throw new AppError('User not found', 404);
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, currentPasswordHash);
      if (!isValid) {
        throw new AppError('Invalid current password', 401);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password in appropriate table
      if (role === 'patient') {
        await this.db`UPDATE patients SET password_hash = ${hashedPassword} WHERE id = ${userId}`;
      } else if (role === 'provider') {
        await this.db`UPDATE providers SET password_hash = ${hashedPassword} WHERE id = ${userId}`;
      } else if (role === 'admin') {
        await this.db`UPDATE admin_users SET password_hash = ${hashedPassword} WHERE id = ${userId}`;
      }

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
      if (decoded.role === 'admin') {
        await this.db`UPDATE admin_users SET password_hash = ${hashedPassword} WHERE id = ${decoded.id}`;
      } else if (decoded.role === 'provider') {
        await this.db`UPDATE providers SET password_hash = ${hashedPassword} WHERE id = ${decoded.id}`;
      } else if (decoded.role === 'patient') {
        await this.db`UPDATE patients SET password_hash = ${hashedPassword} WHERE id = ${decoded.id}`;
      } else {
        throw new AppError('Invalid user role', 400);
      }

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
      let user;
      
      // Find user based on role
      if (role === 'admin') {
        const result = await this.db`SELECT id, email FROM admin_users WHERE email = ${email}`;
        user = result[0];
      } else if (role === 'provider') {
        const result = await this.db`SELECT id, email FROM providers WHERE email = ${email}`;
        user = result[0];
      } else if (role === 'patient') {
        const result = await this.db`SELECT id, email FROM patients WHERE email = ${email}`;
        user = result[0];
      } else {
        throw new AppError('Invalid user role', 400);
      }

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
