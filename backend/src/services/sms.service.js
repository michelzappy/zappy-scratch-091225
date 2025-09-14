import twilio from 'twilio';
import { getDatabase } from '../config/database.js';

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// SMS Templates
const smsTemplates = {
  // Welcome SMS
  welcome: (data) => 
    `Welcome to our Telehealth Platform, ${data.firstName}! Your health journey starts here. Get your first consultation FREE. Reply STOP to unsubscribe.`,

  // Consultation received
  consultationReceived: (data) =>
    `Hi ${data.firstName}, we've received your consultation request. A provider will review it within 24 hours. Check your email for details.`,

  // Treatment plan ready
  treatmentPlanReady: (data) =>
    `Good news ${data.firstName}! Your treatment plan is ready. Visit ${process.env.FRONTEND_URL}/patient/dashboard to view and purchase your medications.`,

  // Order confirmation
  orderConfirmation: (data) =>
    `Order confirmed! Your order #${data.orderNumber} for $${data.total} has been placed. Track it at ${process.env.FRONTEND_URL}/patient/orders/${data.orderId}`,

  // Order shipped
  orderShipped: (data) =>
    `Your order #${data.orderNumber} has shipped! Track it: ${data.trackingUrl}. Est. delivery: ${data.estimatedDelivery}`,

  // Delivery notification
  deliveryNotification: (data) =>
    `Package delivered! Your order #${data.orderNumber} was delivered at ${data.deliveryTime}. Check your ${data.deliveryLocation || 'door'}.`,

  // Refill reminder
  refillReminder: (data) =>
    `Reminder: Your ${data.medicationName} is running low (~${data.daysRemaining} days left). Refill now: ${process.env.FRONTEND_URL}/patient/refill-checkin?id=${data.prescriptionId}`,

  // Prescription expiring
  prescriptionExpiring: (data) =>
    `Your prescription for ${data.medicationName} expires in ${data.daysUntilExpiry} days. Schedule a consultation to renew: ${process.env.FRONTEND_URL}/patient/new-consultation`,

  // Appointment reminder
  appointmentReminder: (data) =>
    `Reminder: You have a telehealth consultation tomorrow at ${data.time}. Login 5 min early: ${process.env.FRONTEND_URL}/patient/dashboard`,

  // Payment failed
  paymentFailed: (data) =>
    `Payment failed for order #${data.orderNumber}. Please update your payment method: ${process.env.FRONTEND_URL}/patient/profile`,

  // Subscription renewal
  subscriptionRenewal: (data) =>
    `Your subscription for ${data.medicationName} renewed successfully. Next delivery: ${data.nextDeliveryDate}. Save 15% every month!`,

  // Two-factor authentication
  twoFactorCode: (data) =>
    `Your verification code is: ${data.code}. This code expires in 10 minutes. Never share this code with anyone.`,

  // Password reset
  passwordReset: (data) =>
    `Password reset requested. If this wasn't you, please ignore. Reset link: ${data.resetLink}`,
};

// Main SMS Service Class
class SMSService {
  constructor() {
    this.client = twilioClient;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  }

  // Format phone number to E.164 format
  formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+${cleaned}`;
    }
    
    // Return as-is if already in correct format
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return `+${cleaned}`;
  }

  // Send single SMS
  async sendSMS(to, template, data) {
    try {
      // Check if Twilio is configured
      if (!this.client) {
        console.warn('Twilio not configured. SMS not sent.');
        return { success: false, error: 'SMS service not configured' };
      }

      // Get message content
      const messageContent = typeof template === 'string' 
        ? template 
        : smsTemplates[template]?.(data);

      if (!messageContent) {
        throw new Error(`SMS template '${template}' not found`);
      }

      // Format phone number
      const formattedTo = this.formatPhoneNumber(to);

      // Check opt-out status
      const isOptedOut = await this.checkOptOutStatus(formattedTo);
      if (isOptedOut) {
        console.log(`User ${formattedTo} has opted out of SMS`);
        return { success: false, error: 'User opted out' };
      }

      // Send SMS using Twilio
      const message = await this.client.messages.create({
        body: messageContent,
        to: formattedTo,
        from: this.fromNumber,
        // Use messaging service if configured (for better deliverability)
        ...(this.messagingServiceSid && { 
          messagingServiceSid: this.messagingServiceSid,
          from: undefined 
        }),
        // Add status callback for delivery tracking
        statusCallback: `${process.env.BACKEND_URL}/webhooks/twilio/status`
      });

      // Log SMS sent
      await this.logSMS(formattedTo, template, messageContent, message.sid, 'sent');

      console.log(`SMS sent successfully to ${formattedTo} with SID: ${message.sid}`);
      return { 
        success: true, 
        messageSid: message.sid,
        to: formattedTo 
      };

    } catch (error) {
      console.error('Error sending SMS:', error);
      await this.logSMS(to, template, '', null, 'failed', error.message);
      throw error;
    }
  }

  // Send batch SMS
  async sendBatchSMS(recipients, template, dataArray) {
    const results = [];
    
    for (let i = 0; i < recipients.length; i++) {
      try {
        const result = await this.sendSMS(
          recipients[i], 
          template, 
          dataArray?.[i] || dataArray
        );
        results.push({ phone: recipients[i], ...result });
      } catch (error) {
        results.push({ 
          phone: recipients[i], 
          success: false, 
          error: error.message 
        });
      }
      
      // Add delay to avoid rate limiting (Twilio allows 1 msg/sec per number)
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
    
    return results;
  }

  // Check if user has opted out
  async checkOptOutStatus(phone) {
    try {
      const query = `
        SELECT opted_out 
        FROM sms_opt_outs 
        WHERE phone_number = $1
      `;
      const db = getDatabase();
      const { rows } = await db.query(query, [phone]);
      return rows.length > 0 && rows[0].opted_out;
    } catch (error) {
      console.error('Error checking opt-out status:', error);
      return false;
    }
  }

  // Handle opt-out
  async handleOptOut(phone) {
    try {
      const query = `
        INSERT INTO sms_opt_outs (phone_number, opted_out, opted_out_at)
        VALUES ($1, true, NOW())
        ON CONFLICT (phone_number) 
        DO UPDATE SET opted_out = true, opted_out_at = NOW()
      `;
      const db = getDatabase();
      await db.query(query, [phone]);
      console.log(`User ${phone} opted out of SMS`);
    } catch (error) {
      console.error('Error handling opt-out:', error);
    }
  }

  // Handle opt-in
  async handleOptIn(phone) {
    try {
      const query = `
        INSERT INTO sms_opt_outs (phone_number, opted_out, opted_in_at)
        VALUES ($1, false, NOW())
        ON CONFLICT (phone_number) 
        DO UPDATE SET opted_out = false, opted_in_at = NOW()
      `;
      const db = getDatabase();
      await db.query(query, [phone]);
      console.log(`User ${phone} opted in to SMS`);
    } catch (error) {
      console.error('Error handling opt-in:', error);
    }
  }

  // Log SMS to database
  async logSMS(to, template, content, messageSid, status, error = null) {
    try {
      const query = `
        INSERT INTO sms_logs (
          recipient, template, content, message_sid, 
          status, error_message, sent_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      const db = getDatabase();
      await db.query(query, [to, template, content, messageSid, status, error]);
    } catch (err) {
      console.error('Error logging SMS:', err);
    }
  }

  // Schedule SMS for later
  async scheduleSMS(to, template, data, sendAt) {
    try {
      const query = `
        INSERT INTO sms_queue (
          recipient, template, data, send_at, 
          status, created_at
        )
        VALUES ($1, $2, $3, $4, 'scheduled', NOW())
        RETURNING id
      `;
      const db = getDatabase();
      const result = await db.query(query, [
        to, 
        template, 
        JSON.stringify(data), 
        sendAt
      ]);
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error scheduling SMS:', error);
      throw error;
    }
  }

  // Process SMS queue (run as cron job)
  async processQueue() {
    try {
      const query = `
        SELECT * FROM sms_queue 
        WHERE status = 'scheduled' 
        AND send_at <= NOW() 
        LIMIT 10
        FOR UPDATE SKIP LOCKED
      `;
      const db = getDatabase();
      const { rows: messages } = await db.query(query);

      for (const msg of messages) {
        try {
          await this.sendSMS(
            msg.recipient,
            msg.template,
            JSON.parse(msg.data || '{}')
          );

          const db = getDatabase();
      await db.query(
            'UPDATE sms_queue SET status = $1, sent_at = NOW() WHERE id = $2',
            ['sent', msg.id]
          );
        } catch (error) {
          await db.query(
            `UPDATE sms_queue 
             SET status = $1, error_message = $2, retry_count = retry_count + 1 
             WHERE id = $3`,
            ['failed', error.message, msg.id]
          );
        }
      }
    } catch (error) {
      console.error('Error processing SMS queue:', error);
    }
  }

  // Send refill reminders (run daily)
  async sendRefillReminders() {
    try {
      // Find prescriptions expiring in 7 days
      const query = `
        SELECT 
          p.id as prescription_id,
          p.expires_date,
          pt.phone,
          pt.first_name,
          m.name as medication_name,
          pi.dosage,
          EXTRACT(DAY FROM (p.expires_date - CURRENT_DATE)) as days_remaining
        FROM prescriptions p
        JOIN prescription_items pi ON p.id = pi.prescription_id
        JOIN medications m ON pi.medication_id = m.id
        JOIN patients pt ON p.patient_id = pt.id
        WHERE p.status = 'active'
        AND p.refills_remaining > 0
        AND p.expires_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM sms_logs 
          WHERE recipient = pt.phone 
          AND template = 'refillReminder'
          AND sent_at > CURRENT_DATE - INTERVAL '3 days'
        )
      `;

      const db = getDatabase();
      const { rows } = await db.query(query);

      for (const prescription of rows) {
        if (prescription.phone) {
          await this.sendSMS(prescription.phone, 'refillReminder', {
            firstName: prescription.first_name,
            medicationName: prescription.medication_name,
            dosage: prescription.dosage,
            daysRemaining: prescription.days_remaining,
            prescriptionId: prescription.prescription_id
          });
        }
      }

      console.log(`Sent ${rows.length} refill reminders`);
    } catch (error) {
      console.error('Error sending refill reminders:', error);
    }
  }

  // Send delivery updates
  async sendDeliveryUpdate(orderId, status) {
    try {
      const query = `
        SELECT 
          o.id, o.order_number, o.tracking_number,
          o.shipped_at, o.delivered_at, o.total_amount,
          p.phone, p.first_name
        FROM orders o
        JOIN patients p ON o.patient_id = p.id
        WHERE o.id = $1
      `;
      const db = getDatabase();
      const { rows } = await db.query(query, [orderId]);
      
      if (rows.length === 0 || !rows[0].phone) return;
      
      const order = rows[0];
      
      let template, data;
      
      switch (status) {
        case 'shipped':
          template = 'orderShipped';
          data = {
            firstName: order.first_name,
            orderNumber: order.order_number,
            trackingUrl: `https://track.carrier.com/${order.tracking_number}`,
            estimatedDelivery: new Date(order.shipped_at).toLocaleDateString()
          };
          break;
          
        case 'delivered':
          template = 'deliveryNotification';
          data = {
            firstName: order.first_name,
            orderNumber: order.order_number,
            deliveryTime: new Date(order.delivered_at).toLocaleTimeString(),
            deliveryLocation: 'door'
          };
          break;
          
        default:
          return;
      }
      
      await this.sendSMS(order.phone, template, data);
    } catch (error) {
      console.error('Error sending delivery update:', error);
    }
  }

  // Verify phone number using Twilio Lookup API
  async verifyPhoneNumber(phone) {
    try {
      if (!this.client) {
        return { valid: false, error: 'SMS service not configured' };
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      
      const lookup = await this.client.lookups.v1
        .phoneNumbers(formattedPhone)
        .fetch({ type: ['carrier'] });

      return {
        valid: true,
        formatted: lookup.phoneNumber,
        carrier: lookup.carrier?.name,
        type: lookup.carrier?.type // 'mobile', 'landline', 'voip'
      };
    } catch (error) {
      console.error('Error verifying phone number:', error);
      return { valid: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new SMSService();
