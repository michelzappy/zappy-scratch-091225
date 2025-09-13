import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for email templates storage
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
);

// Email transporter configuration
const createTransporter = () => {
  // Use SendGrid in production
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    return sgMail;
  }

  // Use nodemailer for development/other providers
  return nodemailer.createTransport({
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

      // If using SendGrid
      if (process.env.SENDGRID_API_KEY) {
        const msg = {
          to,
          from: process.env.EMAIL_FROM || 'noreply@telehealth.com',
          subject,
          html,
        };
        await transporter.send(msg);
      } else {
        // Using nodemailer
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@telehealth.com',
          to,
          subject,
          html,
        });
      }

      // Log email sent to Supabase for audit
      await this.logEmailSent(to, template, data);

      console.log(`Email sent successfully to ${to} using template ${template}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async logEmailSent(to, template, data) {
    try {
      await supabase.from('email_logs').insert({
        recipient: to,
        template,
        data: JSON.stringify(data),
        sent_at: new Date().toISOString(),
        status: 'sent',
      });
    } catch (error) {
      console.error('Error logging email:', error);
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
      await supabase.from('email_queue').insert({
        recipient: to,
        template,
        data: JSON.stringify(data),
        send_at: sendAt,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error queuing email:', error);
      throw error;
    }
  }

  // Process email queue (run this as a cron job)
  async processEmailQueue() {
    try {
      const { data: emails, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('send_at', new Date().toISOString())
        .limit(10);

      if (error) throw error;

      for (const email of emails) {
        try {
          await this.sendEmail(
            email.recipient,
            email.template,
            JSON.parse(email.data)
          );

          await supabase
            .from('email_queue')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', email.id);
        } catch (error) {
          await supabase
            .from('email_queue')
            .update({ 
              status: 'failed', 
              error_message: error.message,
              retry_count: (email.retry_count || 0) + 1
            })
            .eq('id', email.id);
        }
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }
}

export default new EmailService();
