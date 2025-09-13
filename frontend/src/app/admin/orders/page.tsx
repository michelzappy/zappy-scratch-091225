'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders] = useState([
    {
      id: 'ORD-241209-0001',
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      items: [
        { name: 'Amoxicillin 500mg', quantity: 30, price: 24.99 },
        { name: 'Ibuprofen 400mg', quantity: 60, price: 12.99 }
      ],
      total: 43.97,
      status: 'processing',
      paymentStatus: 'paid',
      shippingAddress: '123 Main St, San Francisco, CA 94105',
      createdAt: '2024-12-09T10:30:00Z',
      fulfillmentPartner: 'QuickMeds Pharmacy',
      trackingNumber: null,
    },
    {
      id: 'ORD-241209-0002',
      patientName: 'Emily Johnson',
      patientEmail: 'emily.j@email.com',
      items: [
        { name: 'Lisinopril 10mg', quantity: 90, price: 34.99 }
      ],
      total: 34.99,
      status: 'shipped',
      paymentStatus: 'paid',
      shippingAddress: '456 Oak Ave, Los Angeles, CA 90012',
      createdAt: '2024-12-09T09:15:00Z',
      fulfillmentPartner: 'Regional Health Pharmacy',
      trackingNumber: '1Z999AA1234567890',
      shippedAt: '2024-12-09T14:00:00Z',
    },
    {
      id: 'ORD-241209-0003',
      patientName: 'Michael Brown',
      patientEmail: 'mbrown@email.com',
      items: [
        { name: 'Metformin 500mg', quantity: 60, price: 19.99 },
        { name: 'Atorvastatin 20mg', quantity: 30, price: 28.99 }
      ],
      total: 48.98,
      status: 'delivered',
      paymentStatus: 'paid',
      shippingAddress: '789 Pine St, Seattle, WA 98101',
      createdAt: '2024-12-08T15:45:00Z',
      fulfillmentPartner: 'QuickMeds Pharmacy',
      trackingNumber: '1Z999BB9876543210',
      shippedAt: '2024-12-08T18:00:00Z',
      deliveredAt: '2024-12-09T11:30:00Z',
    },
    {
      id: 'ORD-241209-0004',
      patientName: 'Sarah Davis',
      patientEmail: 'sarah.d@email.com',
      items: [
        { name: 'Sertraline 50mg', quantity: 30, price: 22.99 }
      ],
      total: 22.99,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: '321 Elm St, Portland, OR 97201',
      createdAt: '2024-12-09T11:00:00Z',
      fulfillmentPartner: null,
      trackingNumber: null,
    },
  ]);

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return `${config.bg} ${config.text}`;
  };

  const getPaymentBadge = (status: string) => {
    const statusConfig: any = {
      paid: { bg: 'bg-green-100', text: 'text-green-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
      refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return `${config.bg} ${config.text}`;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'processing') return order.status === 'processing';
    if (activeTab === 'shipped') return order.status === 'shipped';
    if (activeTab === 'delivered') return order.status === 'delivered';
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-sm text-gray-500 mt-1">Track and manage patient orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Export Orders
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Today's Orders</p>
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm text-green-600 mt-1">+12% from yesterday</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Today's Revenue</p>
            <p className="text-2xl font-bold text-gray-900">$1,234</p>
            <p className="text-sm text-green-600 mt-1">+8% from yesterday</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="text-2xl font-bold text-yellow-600">5</p>
            <p className="text-sm text-gray-500 mt-1">Requires action</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-500">Avg. Fulfillment Time</p>
            <p className="text-2xl font-bold text-gray-900">2.4 hrs</p>
            <p className="text-sm text-green-600 mt-1">-15 min from last week</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'processing', 'shipped', 'delivered'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                {tab === 'all' && <span className="ml-2 text-gray-400">({orders.length})</span>}
                {tab === 'pending' && <span className="ml-2 text-gray-400">(1)</span>}
                {tab === 'processing' && <span className="ml-2 text-gray-400">(1)</span>}
                {tab === 'shipped' && <span className="ml-2 text-gray-400">(1)</span>}
                {tab === 'delivered' && <span className="ml-2 text-gray-400">(1)</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Orders Table */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.id}</div>
                    {order.trackingNumber && (
                      <div className="text-xs text-gray-500">Track: {order.trackingNumber}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.patientName}</div>
                    <div className="text-xs text-gray-500">{order.patientEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.map((item, index) => (
                        <div key={index}>
                          {item.name} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">${order.total.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentBadge(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">View</button>
                    {order.status === 'pending' && (
                      <button className="text-green-600 hover:text-green-900">Process</button>
                    )}
                    {order.status === 'processing' && (
                      <button className="text-purple-600 hover:text-purple-900">Ship</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredOrders.length}</span> of{' '}
            <span className="font-medium">{orders.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 bg-indigo-50 border-indigo-500 text-indigo-600">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
