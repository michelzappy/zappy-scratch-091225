import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { MockDataService } from '../services/mock-data.service.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get orders
router.get('/',
  [
    query('patient_id').optional().isUUID(),
    query('provider_id').optional().isUUID(),
    query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patient_id, provider_id, status, limit = 20, offset = 0 } = req.query;
    
    console.log('📦 Mock orders request:', { patient_id, provider_id, status, limit, offset });
    
    try {
      let orders = MockDataService.getOrders();
      
      // Filter orders based on query parameters
      if (patient_id) {
        orders = orders.filter(o => o.patient_id === patient_id);
      }
      if (provider_id) {
        orders = orders.filter(o => o.provider_id === provider_id);
      }
      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      
      // Sort by created date (newest first)
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const paginatedOrders = orders.slice(offset, offset + parseInt(limit));
      
      res.json({
        success: true,
        data: paginatedOrders,
        total: orders.length,
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching mock orders:', error);
      res.status(500).json({
        error: 'Failed to fetch orders',
        message: error.message
      });
    }
  })
);

// Get specific order by ID
router.get('/:orderId',
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    
    console.log('📦 Mock order details request:', orderId);
    
    try {
      const orders = MockDataService.getOrders();
      const order = orders.find(o => o.id === orderId);
      
      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
          message: 'The requested order does not exist'
        });
      }
      
      res.json({
        success: true,
        data: order,
        message: 'Using mock data - database unavailable'
      });
    } catch (error) {
      console.error('Error fetching mock order:', error);
      res.status(500).json({
        error: 'Failed to fetch order',
        message: error.message
      });
    }
  })
);

// Create new order
router.post('/',
  [
    body('patient_id').isUUID(),
    body('provider_id').optional().isUUID(),
    body('consultation_id').optional().isUUID(),
    body('items').isArray().isLength({ min: 1 }),
    body('items.*.medication_id').isUUID(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.price').isFloat({ min: 0 }),
    body('shipping_address').isObject(),
    body('shipping_address.street').isString(),
    body('shipping_address.city').isString(),
    body('shipping_address.state').isString(),
    body('shipping_address.zip_code').isString(),
    body('shipping_address.country').isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { patient_id, provider_id, consultation_id, items, shipping_address } = req.body;
    
    console.log('🛒 Mock create order request:', { patient_id, provider_id, items: items.length });
    
    try {
      // Calculate total
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping_cost = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + shipping_cost + tax;
      
      // Create new mock order
      const newOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patient_id,
        provider_id: provider_id || null,
        consultation_id: consultation_id || null,
        order_number: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        items: items.map(item => ({
          ...item,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping_cost: parseFloat(shipping_cost.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        shipping_address,
        tracking_number: null,
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        data: newOrder,
        message: 'Order created successfully (mock data)'
      });
    } catch (error) {
      console.error('Error creating mock order:', error);
      res.status(500).json({
        error: 'Failed to create order',
        message: error.message
      });
    }
  })
);

// Update order status
router.patch('/:orderId/status',
  [
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    body('tracking_number').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, tracking_number } = req.body;
    
    console.log('📦 Mock update order status:', { orderId, status, tracking_number });
    
    try {
      // In a real app, this would update the database
      // For now, we'll just return success with updated data
      
      const updatedOrder = {
        id: orderId,
        status,
        tracking_number: tracking_number || null,
        updated_at: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: updatedOrder,
        message: 'Order status updated successfully (mock data)'
      });
    } catch (error) {
      console.error('Error updating mock order status:', error);
      res.status(500).json({
        error: 'Failed to update order status',
        message: error.message
      });
    }
  })
);

// Cancel order
router.delete('/:orderId',
  asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    
    console.log('❌ Mock cancel order:', orderId);
    
    try {
      // In a real app, this would update the order status to cancelled
      // For now, we'll just return success
      
      res.json({
        success: true,
        message: 'Order cancelled successfully (mock data)'
      });
    } catch (error) {
      console.error('Error cancelling mock order:', error);
      res.status(500).json({
        error: 'Failed to cancel order',
        message: error.message
      });
    }
  })
);

export default router;