/**
 * Admin Service Layer
 * Handles business logic for admin operations
 */

import { getDatabase } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AdminService {
  constructor() {
    this.db = getDatabase();
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics() {
    const result = await this.db.raw(`
      SELECT 
        (SELECT COUNT(*) FROM patients WHERE is_active = true) as active_patients,
        (SELECT COUNT(*) FROM consultations WHERE status = 'pending') as open_consultations,
        (SELECT COUNT(*) FROM consultations c 
         WHERE c.status = 'pending' AND c.urgency = 'urgent') as urgent_consultations,
        (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_tickets,
        (SELECT COUNT(*) FROM support_tickets WHERE priority = 'high' AND status = 'open') as high_priority_tickets,
        (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') as active_prescriptions,
        (SELECT COUNT(*) FROM orders WHERE payment_status = 'pending') as pending_payments,
        (SELECT COUNT(*) FROM orders WHERE fulfillment_status = 'pending') as pending_fulfillment,
        (SELECT COUNT(*) FROM providers WHERE is_available = true) as available_providers,
        (SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) = CURRENT_DATE) as today_revenue,
        (SELECT COUNT(*) FROM consultations WHERE DATE(created_at) = CURRENT_DATE) as today_consultations,
        (SELECT COUNT(*) FROM patients WHERE DATE(created_at) = CURRENT_DATE) as today_new_patients
    `);

    return result.rows[0] || {};
  }

  /**
   * Get support tickets with filters
   */
  async getSupportTickets({ status = 'open', priority, limit = 20, offset = 0 }) {
    let whereConditions = [`status = $1`];
    let params = [status];
    let paramIndex = 2;

    if (priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }

    const tickets = await this.db.raw(`
      SELECT 
        st.*,
        CASE 
          WHEN st.requester_type = 'patient' THEN p.first_name || ' ' || p.last_name
          WHEN st.requester_type = 'provider' THEN pr.first_name || ' ' || pr.last_name
          ELSE st.requester_email
        END as requester_name,
        au.first_name || ' ' || au.last_name as assigned_to_name
      FROM support_tickets st
      LEFT JOIN patients p ON st.requester_id = p.id AND st.requester_type = 'patient'
      LEFT JOIN providers pr ON st.requester_id = pr.id AND st.requester_type = 'provider'
      LEFT JOIN admins au ON st.assigned_to = au.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE priority 
          WHEN 'high' THEN 0
          WHEN 'medium' THEN 1
          ELSE 2
        END,
        st.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return tickets.rows || [];
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(ticketData) {
    const data = {
      ...ticketData,
      status: 'open',
      created_at: new Date()
    };

    const [ticket] = await this.db
      .insert('support_tickets')
      .values(data)
      .returning();

    return ticket;
  }

  /**
   * Update support ticket
   */
  async updateSupportTicket(ticketId, updateData) {
    const data = {
      ...updateData,
      updated_at: new Date()
    };

    if (updateData.status === 'resolved') {
      data.resolved_at = new Date();
    }

    if (updateData.assigned_to) {
      data.assigned_at = new Date();
    }

    const [updated] = await this.db
      .update('support_tickets')
      .set(data)
      .where({ id: ticketId })
      .returning();

    return updated;
  }

  /**
   * Get problem categories analytics
   */
  async getProblemCategoriesAnalytics() {
    const categories = await this.db.raw(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM support_tickets
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `);

    return categories.rows || [];
  }

  /**
   * Get pending consultations for review
   */
  async getPendingConsultations(limit = 20) {
    const consultations = await this.db.raw(`
      SELECT 
        c.*,
        p.first_name || ' ' || p.last_name as patient_name,
        p.subscription_tier,
        EXTRACT(EPOCH FROM (NOW() - c.submitted_at))/60 as wait_time_minutes,
        CASE 
          WHEN c.provider_id IS NOT NULL THEN pr.first_name || ' ' || pr.last_name
          ELSE 'Unassigned'
        END as provider_name,
        pr.id as provider_id
      FROM consultations c
      JOIN patients p ON c.patient_id = p.id
      LEFT JOIN providers pr ON c.provider_id = pr.id
      WHERE c.status IN ('pending', 'assigned')
      ORDER BY 
        CASE c.urgency 
          WHEN 'emergency' THEN 0
          WHEN 'urgent' THEN 1
          ELSE 2
        END,
        c.submitted_at ASC
      LIMIT ?
    `, [limit]);

    return consultations.rows || [];
  }

  /**
   * Assign consultation to provider
   */
  async assignConsultationToProvider(consultationId, providerId) {
    const [updated] = await this.db
      .update('consultations')
      .set({
        provider_id: providerId,
        status: 'assigned',
        assigned_at: new Date(),
        updated_at: new Date()
      })
      .where({ id: consultationId })
      .returning();

    return updated;
  }

  /**
   * Get all patients with filters
   */
  async getPatients({ search, subscription_tier, limit = 50, offset = 0 }) {
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (subscription_tier) {
      whereConditions.push(`p.subscription_tier = $${paramIndex}`);
      params.push(subscription_tier);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const patients = await this.db.raw(`
      SELECT 
        p.*,
        COUNT(DISTINCT c.id) as total_consultations,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_amount) as total_spent,
        MAX(c.created_at) as last_consultation_date
      FROM patients p
      LEFT JOIN consultations c ON c.patient_id = p.id
      LEFT JOIN orders o ON o.patient_id = p.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return patients.rows || [];
  }

  /**
   * Get all providers with filters
   */
  async getProviders({ is_active, is_available, limit = 50 }) {
    let whereConditions = [];
    if (is_active !== undefined) {
      whereConditions.push(`is_active = ${is_active}`);
    }
    if (is_available !== undefined) {
      whereConditions.push(`is_available = ${is_available}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const providers = await this.db.raw(`
      SELECT 
        p.*,
        COUNT(c.id) as total_consultations_today,
        AVG(EXTRACT(EPOCH FROM (c.completed_at - c.assigned_at))/60) as avg_response_time
      FROM providers p
      LEFT JOIN consultations c ON c.provider_id = p.id AND DATE(c.created_at) = CURRENT_DATE
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [limit]);

    // Remove password hashes
    providers.rows?.forEach(p => delete p.password_hash);

    return providers.rows || [];
  }

  /**
   * Get inventory with filters
   */
  async getInventory({ category, low_stock }) {
    let whereConditions = ['is_active = true'];
    if (category) {
      whereConditions.push(`category = '${category}'`);
    }
    if (low_stock) {
      whereConditions.push(`quantity_on_hand <= reorder_point`);
    }

    const inventory = await this.db.raw(`
      SELECT 
        i.*,
        (quantity_on_hand - quantity_reserved) as available_quantity,
        CASE 
          WHEN quantity_on_hand <= reorder_point THEN 'low'
          WHEN quantity_on_hand <= reorder_point * 2 THEN 'medium'
          ELSE 'good'
        END as stock_status
      FROM inventory i
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE 
          WHEN quantity_on_hand <= reorder_point THEN 0
          ELSE 1
        END,
        medication_name
    `);

    return inventory.rows || [];
  }

  /**
   * Update inventory item
   */
  async updateInventory(inventoryId, updateData) {
    const [updated] = await this.db
      .update('inventory')
      .set({
        ...updateData,
        updated_at: new Date()
      })
      .where({ id: inventoryId })
      .returning();

    return updated;
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics() {
    const stats = await this.db.raw(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN fulfillment_status = 'pending' THEN 1 END) as pending_fulfillment,
        COUNT(CASE WHEN fulfillment_status = 'shipped' THEN 1 END) as shipped_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN is_subscription = true THEN 1 END) as subscription_orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    return stats.rows[0] || {};
  }

  /**
   * Admin login
   */
  async login(email, password) {
    // Find admin user
    const [admin] = await this.db
      .select()
      .from('admins')
      .where({ email })
      .limit(1);

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Check if active
    if (!admin.is_active || admin.status !== 'active') {
      throw new Error('Account is inactive');
    }

    // Update last login
    await this.db
      .update('admins')
      .set({ last_login: new Date() })
      .where({ id: admin.id });

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
      user: admin,
      token
    };
  }

  /**
   * Track analytics event
   */
  async trackAnalyticsEvent(eventData, userId, userRole) {
    const data = {
      ...eventData,
      user_id: userId,
      user_type: userRole,
      created_at: new Date()
    };

    const [event] = await this.db
      .insert('analytics_events')
      .values(data)
      .returning();

    return event;
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(period = 'month') {
    let dateFilter = '';
    switch(period) {
      case 'today':
        dateFilter = "DATE(created_at) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "created_at >= NOW() - INTERVAL '1 year'";
        break;
    }

    const summary = await this.db.raw(`
      SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) as unique_visitors,
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
        COUNT(CASE WHEN event_type = 'consultation_started' THEN 1 END) as consultations_started,
        COUNT(CASE WHEN event_type = 'consultation_completed' THEN 1 END) as consultations_completed,
        COUNT(CASE WHEN event_type = 'order_placed' THEN 1 END) as orders_placed,
        SUM(CASE WHEN event_type = 'order_placed' THEN event_value ELSE 0 END) as total_revenue
      FROM analytics_events
      WHERE ${dateFilter}
    `);

    return {
      data: summary.rows[0] || {},
      period
    };
  }
}

export default AdminService;
