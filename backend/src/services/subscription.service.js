import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getDatabase } from '../config/database.js';
import emailService from './email.service.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic_monthly',
    name: 'Basic Plan',
    price: 29.99,
    interval: 'month',
    features: [
      'Unlimited consultations',
      '20% off medications',
      'Priority support',
      'Free shipping on all orders',
    ],
    stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID || 'prod_basic',
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
  },
  premium: {
    id: 'premium_monthly',
    name: 'Premium Plan',
    price: 49.99,
    interval: 'month',
    features: [
      'Everything in Basic',
      '30% off medications',
      '24/7 provider access',
      'Same-day consultations',
      'Family member accounts (up to 4)',
    ],
    stripeProductId: process.env.STRIPE_PREMIUM_PRODUCT_ID || 'prod_premium',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
  },
  annual: {
    id: 'premium_annual',
    name: 'Premium Annual',
    price: 499.99,
    interval: 'year',
    features: [
      'All Premium features',
      '2 months free',
      'Annual health screening',
      'Dedicated care coordinator',
    ],
    stripeProductId: process.env.STRIPE_ANNUAL_PRODUCT_ID || 'prod_annual',
    stripePriceId: process.env.STRIPE_ANNUAL_PRICE_ID || 'price_annual',
  },
};

class SubscriptionService {
  /**
   * Create a new subscription for a patient
   */
  async createSubscription(patientId, planId, paymentMethodId) {
    try {
      const db = getDatabase();
      const plan = SUBSCRIPTION_PLANS[planId];
      
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      // Get patient details
      const patientResult = await db.query(
        'SELECT * FROM patients WHERE id = $1',
        [patientId]
      );
      
      if (patientResult.rows.length === 0) {
        throw new Error('Patient not found');
      }
      
      const patient = patientResult.rows[0];
      let stripeCustomerId = patient.stripe_customer_id;

      // Create or retrieve Stripe customer
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: patient.email,
          name: `${patient.first_name} ${patient.last_name}`,
          metadata: {
            patientId: patient.id,
          },
        });
        
        stripeCustomerId = customer.id;
        
        // Update patient record with Stripe customer ID
        await db.query(
          'UPDATE patients SET stripe_customer_id = $1 WHERE id = $2',
          [stripeCustomerId, patientId]
        );
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripePriceId }],
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          patientId,
          planId,
        },
      });

      // Save subscription to database
      const subscriptionResult = await db.query(`
        INSERT INTO patient_subscriptions (
          patient_id, stripe_subscription_id, plan_id, 
          status, current_period_start, current_period_end,
          stripe_customer_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        patientId,
        subscription.id,
        planId,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        stripeCustomerId,
        JSON.stringify({
          plan: plan.name,
          price: plan.price,
          features: plan.features,
        }),
      ]);

      // Update patient subscription status
      await db.query(
        'UPDATE patients SET subscription_active = true WHERE id = $1',
        [patientId]
      );

      // Send welcome email
      await emailService.sendEmail(patient.email, 'subscriptionStarted', {
        patientName: patient.first_name,
        planName: plan.name,
        price: plan.price,
        nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
        benefits: plan.features,
      });

      // Log to Supabase
      await supabase.from('subscription_events').insert({
        patient_id: patientId,
        event_type: 'subscription_created',
        plan_id: planId,
        stripe_subscription_id: subscription.id,
        metadata: {
          plan: plan.name,
          price: plan.price,
        },
        created_at: new Date().toISOString(),
      });

      return {
        subscription: subscriptionResult.rows[0],
        stripeSubscription: subscription,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId, reason, immediate = false) {
    try {
      const db = getDatabase();
      
      // Get subscription details
      const subResult = await db.query(
        'SELECT * FROM patient_subscriptions WHERE id = $1',
        [subscriptionId]
      );
      
      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }
      
      const subscription = subResult.rows[0];

      // Cancel in Stripe
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: !immediate,
          cancellation_details: {
            comment: reason,
          },
        }
      );

      // If immediate cancellation, delete the subscription
      if (immediate) {
        await stripe.subscriptions.del(subscription.stripe_subscription_id);
      }

      // Update database
      await db.query(`
        UPDATE patient_subscriptions 
        SET 
          status = $1,
          canceled_at = NOW(),
          cancel_reason = $2,
          cancel_at_period_end = $3
        WHERE id = $4
      `, [
        immediate ? 'canceled' : 'active',
        reason,
        !immediate,
        subscriptionId,
      ]);

      // Update patient subscription status if immediate
      if (immediate) {
        await db.query(
          'UPDATE patients SET subscription_active = false WHERE id = $1',
          [subscription.patient_id]
        );
      }

      // Log event
      await supabase.from('subscription_events').insert({
        patient_id: subscription.patient_id,
        event_type: immediate ? 'subscription_canceled' : 'subscription_scheduled_cancel',
        stripe_subscription_id: subscription.stripe_subscription_id,
        metadata: {
          reason,
          immediate,
        },
        created_at: new Date().toISOString(),
      });

      return { success: true, subscription: canceledSubscription };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId, newPlanId) {
    try {
      const db = getDatabase();
      const newPlan = SUBSCRIPTION_PLANS[newPlanId];
      
      if (!newPlan) {
        throw new Error('Invalid subscription plan');
      }

      // Get current subscription
      const subResult = await db.query(
        'SELECT * FROM patient_subscriptions WHERE id = $1',
        [subscriptionId]
      );
      
      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }
      
      const subscription = subResult.rows[0];

      // Get current Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Update subscription in Stripe
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPlan.stripePriceId,
          }],
          proration_behavior: 'create_prorations',
        }
      );

      // Update database
      await db.query(`
        UPDATE patient_subscriptions 
        SET 
          plan_id = $1,
          metadata = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [
        newPlanId,
        JSON.stringify({
          plan: newPlan.name,
          price: newPlan.price,
          features: newPlan.features,
        }),
        subscriptionId,
      ]);

      // Log event
      await supabase.from('subscription_events').insert({
        patient_id: subscription.patient_id,
        event_type: 'subscription_updated',
        stripe_subscription_id: subscription.stripe_subscription_id,
        metadata: {
          old_plan: subscription.plan_id,
          new_plan: newPlanId,
        },
        created_at: new Date().toISOString(),
      });

      return { success: true, subscription: updatedSubscription };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId, resumeDate) {
    try {
      const db = getDatabase();
      
      // Get subscription
      const subResult = await db.query(
        'SELECT * FROM patient_subscriptions WHERE id = $1',
        [subscriptionId]
      );
      
      if (subResult.rows.length === 0) {
        throw new Error('Subscription not found');
      }
      
      const subscription = subResult.rows[0];

      // Pause in Stripe
      const pausedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          pause_collection: {
            behavior: 'void',
            resumes_at: Math.floor(new Date(resumeDate).getTime() / 1000),
          },
        }
      );

      // Update database
      await db.query(`
        UPDATE patient_subscriptions 
        SET 
          status = 'paused',
          paused_at = NOW(),
          resume_date = $1
        WHERE id = $2
      `, [resumeDate, subscriptionId]);

      return { success: true, subscription: pausedSubscription };
    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(patientId) {
    try {
      const db = getDatabase();
      
      const result = await db.query(`
        SELECT 
          ps.*,
          p.email,
          p.first_name,
          p.last_name
        FROM patient_subscriptions ps
        JOIN patients p ON ps.patient_id = p.id
        WHERE ps.patient_id = $1 
          AND ps.status IN ('active', 'trialing')
        ORDER BY ps.created_at DESC
        LIMIT 1
      `, [patientId]);

      if (result.rows.length === 0) {
        return null;
      }

      const subscription = result.rows[0];
      const plan = SUBSCRIPTION_PLANS[subscription.plan_id];

      return {
        ...subscription,
        plan: {
          ...plan,
          features: plan.features,
        },
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Get available plans
   */
  getAvailablePlans() {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    const db = getDatabase();

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Update subscription status
        await db.query(`
          UPDATE patient_subscriptions 
          SET 
            status = $1,
            current_period_start = $2,
            current_period_end = $3
          WHERE stripe_subscription_id = $4
        `, [
          event.data.object.status,
          new Date(event.data.object.current_period_start * 1000),
          new Date(event.data.object.current_period_end * 1000),
          event.data.object.id,
        ]);
        break;

      case 'customer.subscription.deleted':
        // Mark subscription as canceled
        await db.query(`
          UPDATE patient_subscriptions 
          SET status = 'canceled', canceled_at = NOW()
          WHERE stripe_subscription_id = $1
        `, [event.data.object.id]);

        // Update patient status
        const subResult = await db.query(
          'SELECT patient_id FROM patient_subscriptions WHERE stripe_subscription_id = $1',
          [event.data.object.id]
        );
        
        if (subResult.rows.length > 0) {
          await db.query(
            'UPDATE patients SET subscription_active = false WHERE id = $1',
            [subResult.rows[0].patient_id]
          );
        }
        break;

      case 'invoice.payment_succeeded':
        // Log successful payment
        await supabase.from('subscription_payments').insert({
          stripe_invoice_id: event.data.object.id,
          stripe_subscription_id: event.data.object.subscription,
          amount: event.data.object.amount_paid / 100,
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        });
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        await supabase.from('subscription_payments').insert({
          stripe_invoice_id: event.data.object.id,
          stripe_subscription_id: event.data.object.subscription,
          amount: event.data.object.amount_due / 100,
          status: 'failed',
          error_message: event.data.object.last_payment_error?.message,
        });

        // Send notification email
        // TODO: Send email to patient about failed payment
        break;
    }

    return { received: true };
  }
}

export default new SubscriptionService();
