import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../config/database.js';
import emailService from '../services/email.service.js';
import smsService from '../services/sms.service.js';

const router = express.Router();

// SendGrid webhook for email events
router.post('/sendgrid/events', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature - REQUIRED for security
    const signature = req.headers['x-twilio-email-event-webhook-signature'];
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
    const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
    
    if (!signature || !timestamp || !publicKey) {
      console.error('SendGrid webhook: Missing signature, timestamp, or public key');
      return res.status(401).send('Unauthorized');
    }
    
    // Verify signature using SendGrid's verification method
    const payload = timestamp + req.body.toString();
    const expectedSignature = crypto
      .createHmac('sha256', publicKey)
      .update(payload, 'utf8')
      .digest('base64');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.error('SendGrid webhook: Invalid signature');
      return res.status(401).send('Unauthorized');
    }
    
    // Check timestamp to prevent replay attacks (within 10 minutes)
    const now = Math.floor(Date.now() / 1000);
    const webhookTimestamp = parseInt(timestamp);
    if (Math.abs(now - webhookTimestamp) > 600) {
      console.error('SendGrid webhook: Request too old');
      return res.status(401).send('Request too old');
    }
    
    // Parse events (convert Buffer to string first)
    const events = JSON.parse(req.body.toString());
    
    for (const event of events) {
      // Log webhook event
      const db = getDatabase();
      await db.query(
        `INSERT INTO webhook_logs (service, event_type, payload, processed) 
         VALUES ($1, $2, $3, true)`,
        ['sendgrid', event.event, JSON.stringify(event)]
      );
      
      // Update email log based on event
      switch (event.event) {
        case 'delivered':
          await db.query(
            `UPDATE email_logs 
             SET status = 'delivered', delivered_at = NOW() 
             WHERE message_id = $1`,
            [event.sg_message_id]
          );
          break;
          
        case 'open':
          await db.query(
            `UPDATE email_logs 
             SET status = 'opened', opened_at = NOW() 
             WHERE message_id = $1`,
            [event.sg_message_id]
          );
          break;
          
        case 'click':
          await db.query(
            `UPDATE email_logs 
             SET status = 'clicked', clicked_at = NOW() 
             WHERE message_id = $1`,
            [event.sg_message_id]
          );
          break;
          
        case 'bounce':
        case 'dropped':
          await db.query(
            `UPDATE email_logs 
             SET status = 'bounced', error_message = $2 
             WHERE message_id = $1`,
            [event.sg_message_id, event.reason]
          );
          break;
          
        case 'unsubscribe':
        case 'spamreport':
          // Update user preferences
          await db.query(
            `UPDATE notification_preferences 
             SET email_marketing = false 
             WHERE patient_id = (
               SELECT p.id FROM patients p 
               WHERE p.email = $1
             )`,
            [event.email]
          );
          break;
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Twilio webhook for SMS status updates
router.post('/twilio/status', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, To, From } = req.body;
    
    // Log webhook event
    const db = getDatabase();
    await db.query(
      `INSERT INTO webhook_logs (service, event_type, payload, processed) 
       VALUES ($1, $2, $3, true)`,
      ['twilio', MessageStatus, JSON.stringify(req.body)]
    );
    
    // Update SMS log
    switch (MessageStatus) {
      case 'delivered':
        await db.query(
          `UPDATE sms_logs 
           SET status = 'delivered', delivered_at = NOW() 
           WHERE message_sid = $1`,
          [MessageSid]
        );
        break;
        
      case 'failed':
      case 'undelivered':
        await db.query(
          `UPDATE sms_logs 
           SET status = $1, error_message = $2 
           WHERE message_sid = $3`,
          [MessageStatus, ErrorMessage || ErrorCode, MessageSid]
        );
        break;
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Twilio webhook for incoming SMS (for opt-out handling)
router.post('/twilio/incoming', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { Body, From } = req.body;
    const messageBody = Body.toLowerCase().trim();
    
    // Check for opt-out keywords
    if (['stop', 'unsubscribe', 'cancel', 'end', 'quit'].includes(messageBody)) {
      await smsService.handleOptOut(From);
      
      // Send confirmation (Twilio handles this automatically for STOP)
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>You have been unsubscribed from SMS notifications. Reply START to resubscribe.</Message>
        </Response>
      `);
    } 
    // Check for opt-in keywords
    else if (['start', 'subscribe', 'yes', 'unstop'].includes(messageBody)) {
      await smsService.handleOptIn(From);
      
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>Welcome back! You have been resubscribed to SMS notifications.</Message>
        </Response>
      `);
    }
    // For other messages, log but don't respond
    else {
      const db = getDatabase();
      await db.query(
        `INSERT INTO webhook_logs (service, event_type, payload) 
         VALUES ($1, $2, $3)`,
        ['twilio', 'incoming_sms', JSON.stringify(req.body)]
      );
      
      res.type('text/xml');
      res.send('<Response></Response>');
    }
  } catch (error) {
    console.error('Twilio incoming SMS error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Stripe webhook for payment events
router.post('/stripe/events', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    // Verify webhook signature
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Log webhook event
    const db = getDatabase();
    await db.query(
      `INSERT INTO webhook_logs (service, event_type, payload, processed) 
       VALUES ($1, $2, $3, true)`,
      ['stripe', event.type, JSON.stringify(event)]
    );
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update order status
        await db.query(
          `UPDATE orders 
           SET payment_status = 'paid', paid_at = NOW() 
           WHERE payment_intent_id = $1`,
          [paymentIntent.id]
        );
        
        // Send order confirmation email
        const orderResult = await db.query(
          `SELECT o.*, p.email, p.first_name 
           FROM orders o 
           JOIN patients p ON o.patient_id = p.id 
           WHERE o.payment_intent_id = $1`,
          [paymentIntent.id]
        );
        
        if (orderResult.rows.length > 0) {
          const order = orderResult.rows[0];
          await emailService.sendEmail(order.email, 'orderConfirmation', {
            patientName: order.first_name,
            orderNumber: order.order_number,
            orderId: order.id,
            total: order.total_amount
          });
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        // Update order status
        await db.query(
          `UPDATE orders 
           SET payment_status = 'failed' 
           WHERE payment_intent_id = $1`,
          [failedPayment.id]
        );
        
        // Send payment failed notification
        const failedOrderResult = await db.query(
          `SELECT o.*, p.phone, p.first_name 
           FROM orders o 
           JOIN patients p ON o.patient_id = p.id 
           WHERE o.payment_intent_id = $1`,
          [failedPayment.id]
        );
        
        if (failedOrderResult.rows.length > 0 && failedOrderResult.rows[0].phone) {
          const order = failedOrderResult.rows[0];
          await smsService.sendSMS(order.phone, 'paymentFailed', {
            firstName: order.first_name,
            orderNumber: order.order_number
          });
        }
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        // Update patient subscription status
        await db.query(
          `UPDATE patients 
           SET subscription_status = $1, subscription_id = $2 
           WHERE stripe_customer_id = $3`,
          [
            subscription.status === 'active' ? 'active' : 'cancelled',
            subscription.id,
            subscription.customer
          ]
        );
        break;
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
