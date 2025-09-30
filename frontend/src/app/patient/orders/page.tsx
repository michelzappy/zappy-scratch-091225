'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id?: string;
  name: string;
  instructions: string;
  warnings: string;
  quantity: string;
  refills: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  items: OrderItem[];
  total: string;
  tracking: string;
}

export default function OrdersPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refillRequested, setRefillRequested] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  
  const handleRefillRequest = (prescriptionId: string) => {
    // Navigate directly to the refill checkin page with prescription ID
    router.push(`/patient/refill-checkin?prescriptionId=${prescriptionId}`);
  };
  
  const orders: Order[] = [
    {
      id: 'ORD-001',
      date: 'Dec 9, 2025',
      status: 'delivered',
      items: [
        {
          id: 'RX001',
          name: 'Tretinoin Cream 0.025%',
          instructions: 'Apply at bedtime to clean skin',
          warnings: 'Use sunscreen daily',
          quantity: '1 tube (30g)',
          refills: '2 refills left'
        },
        {
          id: 'RX002',
          name: 'Doxycycline 100mg',
          instructions: 'Take twice daily with food',
          warnings: 'Avoid sun exposure',
          quantity: '60 capsules',
          refills: '1 refill left'
        }
      ],
      total: '$147.00',
      tracking: '9400111899562123456789'
    },
    {
      id: 'ORD-002',
      date: 'Nov 9, 2025',
      status: 'delivered',
      items: [
        {
          id: 'RX003',
          name: 'Finasteride 1mg',
          instructions: 'Take 1 tablet daily',
          warnings: 'Keep away from pregnant women',
          quantity: '30 tablets',
          refills: '5 refills left'
        }
      ],
      total: '$29.00',
      tracking: '9400111899562123456788'
    }
  ];

  const activeShipment = {
    status: 'in-transit',
    expectedDate: 'Dec 12, 2025',
    tracking: '9400111899562123456790',
    carrier: 'UPS',
    progress: 75,
    lastUpdate: 'Package arrived at local facility',
    lastUpdateTime: '2h ago'
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Your Orders</h1>
          <p className="text-slate-600 mt-1">Track shipments and manage medications</p>
        </div>

        {/* Active Shipment */}
        {activeShipment && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-coral-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-coral-600">Package In Transit</p>
                  <p className="text-lg font-semibold text-slate-900">Arrives {activeShipment.expectedDate}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-coral-100 text-coral-700 text-sm font-medium rounded-full">
                {activeShipment.carrier}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-coral-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${activeShipment.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-600">
                <span>{activeShipment.lastUpdate}</span>
                <span>{activeShipment.lastUpdateTime}</span>
              </div>
            </div>
            
            <button 
              onClick={() => window.open(`https://www.ups.com/track?tracknum=${activeShipment.tracking}`, '_blank')}
              className="w-full px-4 py-3 bg-coral-500 text-white font-medium rounded-lg hover:bg-coral-600 transition-colors text-center"
            >
              Track Package: {activeShipment.tracking}
            </button>
          </div>
        )}

        {/* Active Medications */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Medications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {orders[0].items.map((med, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{med.name}</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm text-slate-600">{med.instructions}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-600">{med.warnings}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm text-emerald-600 font-medium">{med.refills}</span>
                  <button 
                    onClick={() => handleRefillRequest(med.id || '')}
                    className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
                  >
                    Health Check-in →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Order History</h2>
        </div>
        
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id}>
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full text-left p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">{order.id}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'delivered' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-coral-600'
                        }`}>
                          {order.status === 'delivered' ? 'Delivered' : 'Shipped'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{order.date}</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-sm text-slate-700">• {item.name}</p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-semibold text-slate-900">{order.total}</p>
                      <svg 
                        className={`w-5 h-5 text-slate-400 mt-2 transition-transform ${
                          expandedOrder === order.id ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
              
                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="px-6 pb-6 bg-slate-50">
                    <div className="space-y-4 pt-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200">
                          <p className="font-medium text-slate-900 mb-3">{item.name}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-slate-700">Instructions:</span>
                              <span className="text-slate-600">{item.instructions}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-amber-700">Warning:</span>
                              <span className="text-amber-600">{item.warnings}</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                              <span className="text-slate-600">{item.quantity}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-emerald-600 font-medium">{item.refills}</span>
                                {parseInt(item.refills) > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefillRequest(item.id || '');
                                    }}
                                    className="text-sm font-medium text-slate-900 hover:text-slate-700 transition-colors"
                                  >
                                    Health Check-in
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-sm text-slate-600">
                          Tracking Number:{' '}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.ups.com/track?tracknum=${order.tracking}`, '_blank');
                            }}
                            className="font-mono font-medium text-coral-600 underline hover:text-coral-700 transition-colors"
                          >
                            {order.tracking}
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
