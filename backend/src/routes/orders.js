import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { getDatabase } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Generate order number
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

// Get patient's treatment plan and prescriptions
router.get('/consultation/:consultationId/treatment', requireAuth, asyncHandler(async (req, res) => {
  const { consultationId } = req.params;
  const db = getDatabase();
  
  // Get consultation with patient info
  const consultationResult = await db.query(`
    SELECT 
      c.id,
      c.patient_id,
      c.diagnosis,
      c.treatment_plan,
      c.status,
      c.medication_offered,
      p.email,
      p.first_name,
      p.last_name,
      p.shipping_address,
      p.shipping_city,
      p.shipping_state,
      p.shipping_zip
    FROM consultations c
    JOIN patients p ON c.patient_id = p.id
    WHERE c.id = $1 AND c.status = 'plan_sent'
  `, [consultationId]);
  
  if (consultationResult.rows.length === 0) {
    return res.status(404).json({ error: 'Treatment plan not found' });
  }
  
  const consultation = consultationResult.rows[0];
  
  // Get prescriptions
  const prescriptionsResult = await db.query(`
    SELECT p.*
    FROM prescriptions p
    WHERE p.consultation_id = $1
  `, [consultationId]);
  
  res.json({
    success: true,
    data: {
      consultation,
      prescriptions: prescriptionsResult.rows
    }
  });
}));

// Create order and process payment
router.post('/create',
  requireAuth,
  [
    body('consultationId').notEmpty().withMessage('Consultation ID required'),
    body('prescriptionIds').isArray().withMessage('Prescription IDs required'),
    body('isSubscription').isBoolean().optional()
  ],
  asyncHandler(async (req, res) => {
    const { 
      consultationId, 
      prescriptionIds, 
      isSubscription = false,
      paymentMethodId 
    } = req.body;
    
    const db = getDatabase();
    
    // Start transaction
    await db.query('BEGIN');
    
    try {
      // Get consultation and patient
      const consultationResult = await db.query(`
        SELECT patient_id FROM consultations WHERE id = $1
      `, [consultationId]);
      
      if (consultationResult.rows.length === 0) {
        throw new Error('Consultation not found');
      }
      
      const patientId = consultationResult.rows[0].patient_id;
      
      // Get patient details
      const patientResult = await db.query(`
        SELECT * FROM patients WHERE id = $1
      `, [patientId]);
      
      const patient = patientResult.rows[0];
      
      // Calculate totals
      const prescriptionsResult = await db.query(`
        SELECT p.*
        FROM prescriptions p
        WHERE p.id = ANY($1)
      `, [prescriptionIds]);
      
      let subtotal = 0;
      const items = [];
      
      for (const prescription of prescriptionsResult.rows) {
        const price = isSubscription ? 
          prescription.subscription_price : 
          prescription.price;
        
        subtotal += price * prescription.quantity;
        
        items.push({
          prescriptionId: prescription.id,
          medicationName: prescription.medication_name,
          quantity: prescription.quantity,
          unitPrice: price,
          totalPrice: price * prescription.quantity
        });
      }
      
      const shippingCost = subtotal >= 50 ? 0 : 5.99;
      const totalAmount = subtotal + shippingCost;
      
      // Create Stripe customer if needed
      let stripeCustomerId = patient.stripe_customer_id;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: patient.email,
          name: `${patient.first_name} ${patient.last_name}`,
          metadata: { patientId: patient.id }
        });
        
        stripeCustomerId = customer.id;
        
        await db.query(
          'UPDATE patients SET stripe_customer_id = $1 WHERE id = $2',
          [stripeCustomerId, patientId]
        );
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convert to cents
        currency: 'usd',
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: false, // Don't confirm yet - let frontend handle 3D Secure
        metadata: {
          consultationId,
          patientId,
          orderType: isSubscription ? 'subscription' : 'one-time'
        }
      });
      
      // Create order record
      const orderNumber = generateOrderNumber();
      const orderResult = await db.query(`
        INSERT INTO orders (
          order_number, patient_id, consultation_id,
          subtotal, shipping_cost, total_amount,
          payment_status, stripe_payment_intent_id,
          shipping_address, shipping_city, shipping_state, shipping_zip,
          is_subscription, subscription_frequency,
          fulfillment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        orderNumber, patientId, consultationId,
        subtotal, shippingCost, totalAmount,
        'pending', paymentIntent.id,
        patient.shipping_address, patient.shipping_city, 
        patient.shipping_state, patient.shipping_zip,
        isSubscription, isSubscription ? 'monthly' : null,
        'pending'
      ]);
      
      const orderId = orderResult.rows[0].id;
      
      // Create order items
      for (const item of items) {
        await db.query(`
          INSERT INTO order_items (
            order_id, prescription_id, medication_name,
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          orderId, item.prescriptionId, item.medicationName,
          item.quantity, item.unitPrice, item.totalPrice
        ]);
      }
      
      await db.query('COMMIT');
      
      res.json({
        success: true,
        data: {
          orderId,
          orderNumber,
          totalAmount,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        }
      });
      
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  })
);

// Confirm payment (after 3D Secure if needed)
router.post('/confirm-payment',
  requireAuth,
  [
    body('paymentIntentId').notEmpty().withMessage('Payment intent ID required')
  ],
  asyncHandler(async (req, res) => {
    const { paymentIntentId } = req.body;
    const db = getDatabase();
    
    // Get payment intent status from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update order status
      const orderResult = await db.query(`
        UPDATE orders
        SET 
          payment_status = 'completed',
          paid_at = NOW(),
          fulfillment_status = 'processing'
        WHERE stripe_payment_intent_id = $1
        RETURNING id, consultation_id, patient_id, order_number
      `, [paymentIntentId]);
      
      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        
        // Update consultation status
        await db.query(`
          UPDATE consultations
          SET 
            medication_ordered = true,
            order_id = $1,
            status = 'medication_ordered',
            completed_at = NOW()
          WHERE id = $2
        `, [order.id, order.consultation_id]);
        
        // Update patient spending
        await db.query(`
          UPDATE patients
          SET 
            total_spent = total_spent + $1,
            total_orders = total_orders + 1,
            updated_at = NOW()
          WHERE id = $2
        `, [paymentIntent.amount / 100, order.patient_id]);
        
        // Note: Inventory tracking removed - handle fulfillment externally
        
        res.json({
          success: true,
          message: 'Payment confirmed and order is being processed',
          data: {
            orderId: order.id,
            orderNumber: order.order_number
          }
        });
      }
    } else {
      res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }
  })
);

// Get order status
router.get('/:orderId/status', requireAuth, asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const db = getDatabase();
  
  const result = await db.query(`
    SELECT 
      o.*,
      p.email,
      p.first_name,
      p.last_name
    FROM orders o
    JOIN patients p ON o.patient_id = p.id
    WHERE o.id = $1
  `, [orderId]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const order = result.rows[0];
  
  // Get order items
  const itemsResult = await db.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [orderId]
  );
  
  res.json({
    success: true,
    data: {
      order,
      items: itemsResult.rows
    }
  });
}));

// Update fulfillment status (for admin/fulfillment team)
router.put('/:orderId/fulfillment',
  requireAuth,
  requireRole(['admin']),
  [
    body('status').isIn(['processing', 'shipped', 'delivered']).withMessage('Invalid status'),
    body('trackingNumber').optional(),
    body('carrier').optional()
  ],
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, trackingNumber, carrier } = req.body;
    const db = getDatabase();
    
    const updateFields = ['fulfillment_status = $1'];
    const values = [status];
    let paramIndex = 2;
    
    if (status === 'shipped') {
      updateFields.push(`shipped_at = NOW()`);
      if (trackingNumber) {
        updateFields.push(`tracking_number = $${paramIndex++}`);
        values.push(trackingNumber);
      }
      if (carrier) {
        updateFields.push(`carrier = $${paramIndex++}`);
        values.push(carrier);
      }
    } else if (status === 'delivered') {
      updateFields.push(`delivered_at = NOW()`);
    }
    
    values.push(orderId);
    
    const result = await db.query(`
      UPDATE orders
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

export default router;
