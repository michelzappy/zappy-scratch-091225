'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  patientName: string;
  patientEmail: string;
  items: OrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  total: number;
  date: string;
  shippingAddress: string;
  fulfillmentPartner?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }

    // Simulate fetching order data
    setTimeout(() => {
      // Mock order data - in a real app, this would be fetched from an API
      setOrder({
        id: orderId,
        orderNumber: `ORD-${orderId.padStart(6, '0')}`,
        patientName: 'John Doe',
        patientEmail: 'john.doe@example.com',
        items: [
          { name: 'Tretinoin Cream 0.025%', quantity: 1, price: 49 },
          { name: 'Doxycycline 100mg', quantity: 30, price: 35 }
        ],
        status: 'processing',
        paymentStatus: 'paid',
        total: 84,
        date: new Date().toISOString(),
        shippingAddress: '123 Main St, Anytown, CA 12345',
        fulfillmentPartner: 'TruePill',
        trackingNumber: undefined,
        shippedAt: undefined,
        deliveredAt: undefined
      });
      setLoading(false);
    }, 500);
  }, [orderId, router]);

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Order not found</p>
        <button
          onClick={() => router.push('/portal/orders')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
        <button
          onClick={() => router.push('/portal/orders')}
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Order Status</p>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Payment Status</p>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </span>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-lg font-semibold text-gray-900">${order.total}</p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{order.patientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{order.patientEmail}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Shipping Address</p>
            <p className="font-medium">{order.shippingAddress}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
              </div>
              <p className="font-medium text-gray-900">${item.price}</p>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 font-semibold">
            <p>Total</p>
            <p>${order.total}</p>
          </div>
        </div>
      </div>

      {/* Fulfillment Information */}
      {order.fulfillmentPartner && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Fulfillment Partner</p>
              <p className="font-medium">{order.fulfillmentPartner}</p>
            </div>
            {order.trackingNumber && (
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="font-medium text-blue-600">{order.trackingNumber}</p>
              </div>
            )}
            {order.shippedAt && (
              <div>
                <p className="text-sm text-gray-500">Shipped Date</p>
                <p className="font-medium">
                  {new Date(order.shippedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
            {order.deliveredAt && (
              <div>
                <p className="text-sm text-gray-500">Delivered Date</p>
                <p className="font-medium">
                  {new Date(order.deliveredAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => router.push('/portal/orders')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back to Orders
        </button>
        {order.status === 'pending' && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Process Order
          </button>
        )}
        {order.status === 'processing' && (
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Mark as Shipped
          </button>
        )}
        {order.paymentStatus === 'paid' && order.status !== 'cancelled' && (
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Refund Order
          </button>
        )}
      </div>
    </div>
  );
}