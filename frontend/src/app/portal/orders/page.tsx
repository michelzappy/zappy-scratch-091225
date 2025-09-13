'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

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

export default function OrdersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    if (role) {
      setUserRole(role);
      if (role === 'provider') {
        // Regular providers might not have access
        router.push('/portal/dashboard');
        return;
      }
    }

    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    // Mock data with enhanced details
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        patientName: 'Sarah Johnson',
        patientEmail: 'sarah.j@email.com',
        items: [
          { name: 'Tretinoin 0.025%', quantity: 1, price: 59.99 },
          { name: 'Moisturizer SPF 30', quantity: 2, price: 15.00 }
        ],
        status: 'processing',
        paymentStatus: 'paid',
        total: 89.99,
        date: '2024-01-15T10:00:00',
        shippingAddress: '123 Main St, San Francisco, CA 94105',
        fulfillmentPartner: 'QuickMeds Pharmacy',
        trackingNumber: undefined
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        patientName: 'Michael Chen',
        patientEmail: 'mchen@email.com',
        items: [
          { name: 'Hydrocortisone 2.5%', quantity: 1, price: 45.00 }
        ],
        status: 'shipped',
        paymentStatus: 'paid',
        total: 45.00,
        date: '2024-01-14T15:00:00',
        shippingAddress: '456 Oak Ave, Los Angeles, CA 90012',
        fulfillmentPartner: 'Regional Health Pharmacy',
        trackingNumber: '1Z999AA10123456784',
        shippedAt: '2024-01-15T09:00:00'
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-003',
        patientName: 'Emily Davis',
        patientEmail: 'emily.d@email.com',
        items: [
          { name: 'Doxycycline 100mg', quantity: 30, price: 65.50 },
          { name: 'Cleanser', quantity: 1, price: 30.00 },
          { name: 'Sunscreen', quantity: 1, price: 30.00 }
        ],
        status: 'delivered',
        paymentStatus: 'paid',
        total: 125.50,
        date: '2024-01-10T09:00:00',
        shippingAddress: '789 Pine St, Seattle, WA 98101',
        fulfillmentPartner: 'QuickMeds Pharmacy',
        trackingNumber: '1Z999AA10123456785',
        shippedAt: '2024-01-11T10:00:00',
        deliveredAt: '2024-01-13T14:30:00'
      },
      {
        id: '4',
        orderNumber: 'ORD-2024-004',
        patientName: 'James Wilson',
        patientEmail: 'jwilson@email.com',
        items: [
          { name: 'Sertraline 50mg', quantity: 30, price: 22.99 }
        ],
        status: 'pending',
        paymentStatus: 'pending',
        total: 22.99,
        date: '2024-01-15T11:00:00',
        shippingAddress: '321 Elm St, Portland, OR 97201',
        fulfillmentPartner: undefined
      },
    ];
    
    setOrders(mockOrders);
    setLoading(false);
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus as any } : order
    );
    setOrders(updatedOrders);
    alert(`Order ${orderId} status updated to ${newStatus}`);
  };

  const filteredOrders = orders.filter(order =>
    filter === 'all' || order.status === filter
  );

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate metrics
  const todaysOrders = orders.filter(o => 
    new Date(o.date).toDateString() === new Date().toDateString()
  );
  const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const avgFulfillmentTime = '2.4 hrs'; // Mock value

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1">Track and manage patient orders</p>
        </div>
        <button 
          onClick={() => alert('Export functionality coming soon!')}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Export Orders
        </button>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Today's Orders</p>
          <p className="text-2xl font-bold text-gray-900">{todaysOrders.length}</p>
          <p className="text-sm text-green-600 mt-1">+12% from yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Today's Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${todaysRevenue.toFixed(2)}</p>
          <p className="text-sm text-green-600 mt-1">+8% from yesterday</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">Requires action</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Processing</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'processing').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">In fulfillment</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg. Fulfillment</p>
          <p className="text-2xl font-bold text-gray-900">{avgFulfillmentTime}</p>
          <p className="text-sm text-green-600 mt-1">-15 min from last week</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {['all', 'pending', 'processing', 'shipped', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status as any);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition capitalize ${
              filter === status 
                ? 'bg-gray-900 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status}
            {status === 'all' && <span className="ml-2 text-gray-400">({orders.length})</span>}
            {status !== 'all' && (
              <span className="ml-2 text-gray-400">
                ({orders.filter(o => o.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Enhanced Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </div>
                    {order.trackingNumber && (
                      <div className="text-xs text-gray-500">
                        Track: {order.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.patientName}</div>
                    <div className="text-xs text-gray-500">{order.patientEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.map((item, index) => (
                        <div key={index}>
                          {item.name} x{item.quantity}
                          <span className="text-xs text-gray-500 ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${order.total.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(order.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => router.push(`/portal/order/${order.id}`)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      View
                    </button>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'processing')}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Process
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button 
                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Ship
                      </button>
                    )}
                    {order.trackingNumber && (
                      <button 
                        onClick={() => window.open(`https://track.example.com/${order.trackingNumber}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900 ml-3"
                      >
                        Track
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastOrder, filteredOrders.length)}
            </span>{' '}
            of <span className="font-medium">{filteredOrders.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 border rounded text-sm ${
                  currentPage === index + 1
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
