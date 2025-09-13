'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import Timeline from '@/components/Timeline';
import { TimelineEvent } from '@/components/Timeline';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  const orders = [
    {
      id: 'ORD-001',
      date: 'Dec 9, 2025',
      status: 'delivered',
      items: [
        {
          name: 'Tretinoin Cream 0.025%',
          instructions: 'Apply a pea-sized amount to clean, dry skin at bedtime. Start every other night for 2 weeks, then nightly.',
          warnings: '⚠️ Use sunscreen daily. May cause initial dryness and peeling.',
          quantity: '1 tube (30g)',
          refills: '2 remaining'
        },
        {
          name: 'Doxycycline 100mg',
          instructions: 'Take 1 capsule twice daily with food and a full glass of water.',
          warnings: '⚠️ Avoid lying down for 30 minutes after taking. May increase sun sensitivity.',
          quantity: '60 capsules',
          refills: '1 remaining'
        }
      ],
      total: '$147.00',
      tracking: 'USPS 9400111899562123456789'
    },
    {
      id: 'ORD-002',
      date: 'Nov 9, 2025',
      status: 'delivered',
      items: [
        {
          name: 'Finasteride 1mg',
          instructions: 'Take 1 tablet daily at the same time each day, with or without food.',
          warnings: '⚠️ Women who are pregnant should not handle crushed tablets.',
          quantity: '30 tablets',
          refills: '5 remaining'
        }
      ],
      total: '$29.00',
      tracking: 'USPS 9400111899562123456788'
    }
  ];

  const currentOrderEvents: TimelineEvent[] = [
    {
      id: '1',
      date: 'Dec 9, 2025 10:00 AM',
      title: 'Order Placed',
      description: 'Your order has been confirmed',
      status: 'completed',
      type: 'order'
    },
    {
      id: '2',
      date: 'Dec 9, 2025 2:00 PM',
      title: 'Prescription Verified',
      description: 'Provider approved prescription',
      status: 'completed',
      type: 'prescription'
    },
    {
      id: '3',
      date: 'Dec 10, 2025 9:00 AM',
      title: 'Order Packed',
      description: 'Your medication has been packaged',
      status: 'completed',
      type: 'order'
    },
    {
      id: '4',
      date: 'Dec 10, 2025 3:00 PM',
      title: 'Shipped',
      description: 'Package handed to USPS',
      status: 'completed',
      type: 'order'
    },
    {
      id: '5',
      date: 'Dec 12, 2025',
      title: 'Out for Delivery',
      description: 'Expected delivery today',
      status: 'in-progress',
      type: 'order'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Medication Orders</h1>
        <p className="text-slate-600 mt-2">Track your orders and view medication instructions</p>
      </div>

      {/* Active Medications */}
      <Card title="Active Medications & Instructions">
        <div className="space-y-4">
          {orders[0].items.map((med, idx) => (
            <div key={idx} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-blue-900">{med.name}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Active</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">How to take:</p>
                  <p className="text-sm text-gray-600">{med.instructions}</p>
                </div>
                
                <div className="bg-yellow-100 border border-yellow-300 rounded p-2">
                  <p className="text-sm text-yellow-800">{med.warnings}</p>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity: {med.quantity}</span>
                  <span className="text-blue-600 font-medium">{med.refills}</span>
                </div>
              </div>
              
              <div className="mt-3 flex space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Request Refill
                </button>
                <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                  Download Instructions PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Current Order Status */}
      <Card title="Current Order - #ORD-003">
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-900">In Transit</span>
              <span className="text-sm text-blue-700">Expected Dec 12, 2025</span>
            </div>
            <div className="text-sm text-blue-800">
              Tracking: USPS 9400111899562123456790
            </div>
          </div>
          
          <Timeline events={currentOrderEvents} />
        </div>
      </Card>

      {/* Order History */}
      <Card title="Order History">
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border-b border-slate-200 pb-4 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-slate-900">{order.id}</span>
                    <span className="text-sm text-slate-500">{order.date}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'delivered' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'delivered' ? 'Delivered' : 'In Transit'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm text-slate-600">• {item.name}</p>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Tracking: {order.tracking}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{order.total}</p>
                  <button 
                    onClick={() => setSelectedOrder(order.id)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
                  >
                    View Details →
                  </button>
                </div>
              </div>
              
              {/* Expanded Order Details */}
              {selectedOrder === order.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-700 mb-3">Medication Details:</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="mb-3 pb-3 border-b last:border-0">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600 mt-1">Instructions: {item.instructions}</p>
                      <p className="text-xs text-orange-600 mt-1">{item.warnings}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Refill Management">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600">Next auto-refill:</span>
            <span className="font-semibold text-slate-900">Jan 5, 2026</span>
          </div>
          <button className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Manage Refills
          </button>
        </Card>

        <Card title="Medication Reminders">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-600">Daily reminders:</span>
            <span className="font-semibold text-green-600">On</span>
          </div>
          <button className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Configure Reminders
          </button>
        </Card>

        <Card title="Need Help?">
          <p className="text-sm text-slate-600 mb-4">
            Questions about your medication?
          </p>
          <button className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Ask Pharmacist
          </button>
        </Card>
      </div>
    </div>
  );
}
