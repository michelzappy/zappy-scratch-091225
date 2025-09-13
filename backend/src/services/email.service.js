import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import pool from '../config/database.js';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email transporter configuration
const createTransporter = () => {
  // Use SendGrid in production
  if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY) {
    return 'sendgrid';
  }

  // Use nodemailer for development/testing
  if (process.env.NODE_ENV === 'development') {
    // Use Ethereal Email for testing (free fake SMTP service)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'ethereal.user',
        pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
      }
    });
  }

  // Fallback to SMTP configuration
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
  // Welcome email for new patients
  welcome: {
    subject: 'Welcome to Our Telehealth Platform',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Your Health Journey</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Hello ${data.firstName},</h2>
          <p>Thank you for joining our telehealth platform. We're here to make healthcare accessible and convenient.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Getting Started</h3>
            <ol style="line-height: 1.8;">
              <li>Complete your health questionnaire</li>
              <li>Consult with a licensed provider</li>
              <li>Receive your personalized treatment plan</li>
              <li>Get medications delivered discreetly to your door</li>
            </ol>
          </div>
          
          <p><strong>Remember:</strong> Your first consultation is FREE!</p>
          
          <a href="${process.env.FRONTEND_URL}/patient/new-consultation" 
             style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Start Consultation
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Telehealth Platform. All rights reserved.</p>
          <p>Need help? Contact support@telehealth.com</p>
        </div>
      </div>
    `,
  },

  consultationReceived: {
    subject: 'Your consultation request has been received',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Consultation Received</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Hello ${data.patientName},</h2>
          <p>We've received your consultation request for <strong>${data.chiefComplaint}</strong>.</p>
          <p>A healthcare provider will review your case within 24 hours.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>What happens next?</h3>
            <ul>
              <li>A licensed provider will review your information</li>
              <li>You'll receive a treatment plan if appropriate</li>
              <li>Any prescribed medications will be available for purchase</li>
            </ul>
          </div>
          <p>Consultation ID: <code>${data.consultationId}</code></p>
          <a href="${process.env.FRONTEND_URL}/patient/dashboard" 
             style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View Dashboard
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Telehealth Platform. All rights reserved.</p>
          <p>This email contains confidential health information.</p>
        </div>
      </div>
    `,
  },

  treatmentPlanReady: {
    subject: 'Your treatment plan is ready',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Treatment Plan Ready</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Hello ${data.patientName},</h2>
          <p>Good news! Your provider has reviewed your consultation and prepared a treatment plan.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Diagnosis</h3>
            <p>${data.diagnosis}</p>
            
            <h3>Treatment Plan</h3>
            <p>${data.treatmentPlan}</p>
            
            ${data.medications && data.medications.length > 0 ? `
              <h3>Prescribed Medications</h3>
              <ul>
                ${data.medications.map(med => `
                  <li><strong>${med.name}</strong> - ${med.dosage} - $${med.price}</li>
                `).join('')}
              </ul>
              <p><strong>Total: $${data.totalCost}</strong></p>
            ` : ''}
          </div>
          
          ${data.medications && data.medications.length > 0 ? `
            <a href="${process.env.FRONTEND_URL}/patient/checkout?consultationId=${data.consultationId}" 
               style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
              Purchase Medications
            </a>
          ` : ''}
          
          <p style="margin-top: 20px;">You can message your provider if you have any questions.</p>
        </div>
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Telehealth Platform. All rights reserved.</p>
        </div>
      </div>
    `,
  },

  orderConfirmation: {
    subject: 'Order Confirmation - #{{orderNumber}}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Thank you for your order, ${data.patientName}!</h2>
          <p>Order Number: <strong>${data.orderNumber}</strong></p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.items.map(item => `
                <tr>
                  <td style="padding: 8px 0;">${item.name}</td>
                  <td style="text-align: right;">$${item.price}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 1px solid #ddd;">
                <td style="padding: 8px 0;"><strong>Subtotal</strong></td>
                <td style="text-align: right;"><strong>$${data.subtotal}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Shipping</td>
                <td style="text-align: right;">$${data.shipping}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Tax</td>
                <td style="text-align: right;">$${data.tax}</td>
              </tr>
              <tr style="border-top: 2px solid #333;">
                <td style="padding: 8px 0;"><strong>Total</strong></td>
                <td style="text-align: right;"><strong>$${data.total}</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Shipping Information</h3>
            <p>${data.shippingAddress}</p>
            <p>Estimated delivery: 3-5 business days</p>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/patient/orders/${data.orderId}" 
             style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Track Order
          </a>
        </div>
      </div>
    `,
  },

  orderShipped: {
    subject: 'Your order has shipped!',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Shipped!</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Great news, ${data.patientName}!</h2>
          <p>Your order <strong>#${data.orderNumber}</strong> has been shipped.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Tracking Information</h3>
            <p>Carrier: ${data.carrier}</p>
            <p>Tracking Number: <strong>${data.trackingNumber}</strong></p>
            <p>Estimated Delivery: ${data.estimatedDelivery}</p>
            <a href="${data.trackingUrl}" 
               style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 10px;">
              Track Package
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📦 Package will be delivered in discreet packaging</strong></p>
          </div>
        </div>
      </div>
    `,
  },

  subscriptionStarted: {
    subject: 'Welcome to your subscription plan',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Activated!</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Welcome to your subscription, ${data.patientName}!</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Plan Details</h3>
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Price:</strong> $${data.price}/month</p>
            <p><strong>Next billing date:</strong> ${data.nextBillingDate}</p>
            
            <h4>Benefits Include:</h4>
            <ul>
              ${data.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
          
          <a href="${process.env.FRONTEND_URL}/patient/subscription" 
             style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Manage Subscription
          </a>
        </div>
      </div>
    `,
  },

  passwordReset: {
    subject: 'Reset your password',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Hello ${data.name},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
          <a href="${data.resetLink}" 
             style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  },

  refillReminder: {
    subject: 'Time to refill your medication',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Refill Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Hello ${data.patientName},</h2>
          <p>Your medication <strong>${data.medicationName}</strong> is running low.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Prescription Details</h3>
            <p><strong>Medication:</strong> ${data.medicationName}</p>
            <p><strong>Dosage:</strong> ${data.dosage}</p>
            <p><strong>Last Refill:</strong> ${data.lastRefillDate}</p>
            <p><strong>Estimated Days Remaining:</strong> ${data.daysRemaining}</p>
          </div>
          
          <p>Don't wait until you run out. Refill now to ensure continuous treatment.</p>
          
          <a href="${process.env.FRONTEND_URL}/patient/refill-checkin?prescriptionId=${data.prescriptionId}" 
             style="display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Refill Now
          </a>
          
          <p style="margin-top: 20px; color: #666;">
            <small>Save 15% with auto-refill subscription</small>
          </p>
        </div>
      </div>
    `,
  },

  deliveryNotification: {
    subject: 'Your medication has been delivered',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Package Delivered!</h1>
        </div>
        <div style="padding: 30px; background: #f7f7f7;">
          <h2>Hello ${data.patientName},</h2>
          <p>Great news! Your order <strong>#${data.orderNumber}</strong> has been delivered.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Delivery Confirmation</h3>
            <p><strong>Delivered to:</strong> ${data.deliveryAddress}</p>
            <p><strong>Delivered at:</strong> ${data.deliveryTime}</p>
            <p><strong>Signed by:</strong> ${data.signedBy || 'Left at door'}</p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>📦 Your package was delivered in discreet packaging</strong></p>
          </div>
          
          <p>If you have any issues with your order, please contact us immediately.</p>
          
          <a href="${process.env.FRONTEND_URL}/patient/orders/${data.orderId}" 
             style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View Order Details
          </a>
        </div>
      </div>
    `,
  },
};

// Main email service class
class EmailService {
  async sendEmail(to, template, data) {
    try {
      const emailTemplate = emailTemplates[template];
      if (!emailTemplate) {
        throw new Error(`Email template '${template}' not found`);
      }

      const subject = emailTemplate.subject.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
      const html = emailTemplate.html(data);

      let messageId;

      // Use SendGrid for production
      if (transporter === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        const msg = {
          to,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@telehealth.com',
            name: process.env.SENDGRID_FROM_NAME || 'Telehealth Platform'
          },
          replyTo: process.env.SENDGRID_REPLY_TO || 'support@telehealth.com',
          subject,
          html,
          trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true }
          }
        };

        const [response] = await sgMail.send(msg);
        messageId = response.headers['x-message-id'];
      } else {
        // Use nodemailer for development/testing
        const info = await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'Telehealth Platform'}" <${process.env.EMAIL_FROM || 'noreply@telehealth.com'}>`,
          to,
          subject,
          html,
        });
        messageId = info.messageId;

        // Log test email URL if using Ethereal
        if (process.env.NODE_ENV === 'development') {
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
      }

      // Log email sent to database for audit
      await this.logEmailSent(to, template, data, messageId);

      console.log(`Email sent successfully to ${to} using template ${template}`);
      return { success: true, messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      await this.logEmailError(to, template, error);
      throw error;
    }
  }

  async logEmailSent(to, template, data, messageId) {
    try {
      const query = `
        INSERT INTO email_logs (recipient, template, data, message_id, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      await pool.query(query, [to, template, JSON.stringify(data), messageId, 'sent']);
    } catch (error) {
      console.error('Error logging email:', error);
    }
  }

  async logEmailError(to, template, error) {
    try {
      const query = `
        INSERT INTO email_logs (recipient, template, status, error_message, sent_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await pool.query(query, [to, template, 'failed', error.message]);
    } catch (error) {
      console.error('Error logging email error:', error);
    }
  }

  // Batch email sending for notifications
  async sendBatchEmails(recipients, template, dataArray) {
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      try {
        await this.sendEmail(recipients[i], template, dataArray[i]);
        results.push({ email: recipients[i], success: true });
      } catch (error) {
        results.push({ email: recipients[i], success: false, error: error.message });
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }

  // Queue email for delayed sending
  async queueEmail(to, template, data, sendAt) {
    try {
      const query = `
        INSERT INTO email_queue (recipient, template, data, send_at, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())
        RETURNING id
      `;
      const result = await pool.query(query, [to, template, JSON.stringify(data), sendAt]);
      return result.rows[0].id;
    } catch (error) {
      console.error('Error queuing email:', error);
      throw error;
    }
  }

  // Process email queue (run this as a cron job)
  async processEmailQueue() {
    try {
      const query = `
        SELECT * FROM email_queue 
        WHERE status = 'pending' 
        AND send_at <= NOW() 
        LIMIT 10
        FOR UPDATE SKIP LOCKED
      `;
      const { rows: emails } = await pool.query(query);

      for (const email of emails) {
        try {
          await this.sendEmail(
            email.recipient,
            email.template,
            JSON.parse(email.data)
          );

          await pool.query(
            'UPDATE email_queue SET status = $1, sent_at = NOW() WHERE id = $2',
            ['sent', email.id]
          );
        } catch (error) {
          await pool.query(
            `UPDATE email_queue 
             SET status = $1, error_message = $2, retry_count = retry_count + 1 
             WHERE id = $3`,
            ['failed', error.message, email.id]
          );
        }
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }

  // Send consultation-related emails
  async sendConsultationEmails(consultationId) {
    try {
      const query = `
        SELECT 
          c.id, c.chief_complaint, c.status,
          p.email, p.first_name, p.last_name
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.id = $1
      `;
      const { rows } = await pool.query(query, [consultationId]);
      
      if (rows.length === 0) return;
      
      const consultation = rows[0];
      const patientName = `${consultation.first_name} ${consultation.last_name}`;

      // Send appropriate email based on status
      if (consultation.status === 'pending') {
        await this.sendEmail(consultation.email, 'consultationReceived', {
          patientName,
          chiefComplaint: consultation.chief_complaint,
          consultationId: consultation.id
        });
      } else if (consultation.status === 'approved') {
        // Get prescription details
        const prescriptionQuery = `
          SELECT pi.*, m.name, m.base_price
          FROM prescriptions p
          JOIN prescription_items pi ON p.id = pi.prescription_id
          JOIN medications m ON pi.medication_id = m.id
          WHERE p.consultation_id = $1
        `;
        const { rows: medications } = await pool.query(prescriptionQuery, [consultationId]);
        
        const totalCost = medications.reduce((sum, med) => sum + parseFloat(med.base_price), 0);

        await this.sendEmail(consultation.email, 'treatmentPlanReady', {
          patientName,
          consultationId: consultation.id,
          diagnosis: 'Based on your symptoms', // Would come from provider notes
          treatmentPlan: 'Your personalized treatment plan',
          medications: medications.map(m => ({
            name: m.name,
            dosage: m.dosage,
            price: m.base_price
          })),
          totalCost: totalCost.toFixed(2)
        });
      }
    } catch (error) {
      console.error('Error sending consultation emails:', error);
    }
  }
}

export default new EmailService();
