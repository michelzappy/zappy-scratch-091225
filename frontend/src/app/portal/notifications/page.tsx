'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'order' | 'prescription' | 'consultation' | 'system' | 'billing';
  actionUrl?: string;
  actionLabel?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }

    // Simulate loading notifications
    setTimeout(() => {
      setNotifications([
        {
          id: '1',
          title: 'New Order Received',
          message: 'Order #ORD-2025-001 has been placed by John Doe for Tretinoin Cream',
          time: '9:30 AM',
          date: 'Today',
          read: false,
          type: 'info',
          category: 'order',
          actionUrl: '/portal/orders/1',
          actionLabel: 'View Order'
        },
        {
          id: '2',
          title: 'Prescription Expiring Soon',
          message: '3 patients have prescriptions expiring in the next 7 days. Review and renew as needed.',
          time: '8:00 AM',
          date: 'Today',
          read: false,
          type: 'warning',
          category: 'prescription',
          actionUrl: '/portal/prescriptions',
          actionLabel: 'View Prescriptions'
        },
        {
          id: '3',
          title: 'Consultation Completed',
          message: 'Dr. Smith has completed consultation #CON-2025-123 for patient Jane Doe',
          time: '4:45 PM',
          date: 'Yesterday',
          read: true,
          type: 'success',
          category: 'consultation',
          actionUrl: '/portal/consultations/123',
          actionLabel: 'View Details'
        },
        {
          id: '4',
          title: 'System Maintenance Scheduled',
          message: 'The portal will undergo maintenance on Sunday, September 21 at 2:00 AM EST. Expected downtime: 2 hours.',
          time: '2:00 PM',
          date: 'Yesterday',
          read: true,
          type: 'info',
          category: 'system'
        },
        {
          id: '5',
          title: 'Payment Received',
          message: 'Payment of $149.00 has been received for Order #ORD-2025-002',
          time: '11:30 AM',
          date: 'Sep 16, 2025',
          read: true,
          type: 'success',
          category: 'billing',
          actionUrl: '/portal/billing',
          actionLabel: 'View Transaction'
        },
        {
          id: '6',
          title: 'Low Stock Alert',
          message: 'Doxycycline 100mg is running low on stock. Current quantity: 45 units',
          time: '3:15 PM',
          date: 'Sep 16, 2025',
          read: false,
          type: 'warning',
          category: 'system',
          actionUrl: '/portal/medications',
          actionLabel: 'Manage Inventory'
        },
        {
          id: '7',
          title: 'New Consultation Request',
          message: 'Michael Johnson has requested a consultation for hair loss treatment',
          time: '10:00 AM',
          date: 'Sep 15, 2025',
          read: true,
          type: 'info',
          category: 'consultation',
          actionUrl: '/portal/consultations',
          actionLabel: 'View Request'
        },
        {
          id: '8',
          title: 'Order Shipped',
          message: 'Order #ORD-2025-003 has been shipped via FedEx. Tracking: 1234567890',
          time: '5:00 PM',
          date: 'Sep 15, 2025',
          read: true,
          type: 'success',
          category: 'order',
          actionUrl: '/portal/orders/3',
          actionLabel: 'Track Order'
        }
      ]);
      setLoading(false);
    }, 500);
  }, [router]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getCategoryBadgeColor = (category: Notification['category']) => {
    switch (category) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'prescription':
        return 'bg-purple-100 text-purple-800';
      case 'consultation':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'billing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread' && notif.read) return false;
    if (categoryFilter !== 'all' && notif.category !== categoryFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All notifications read'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === 'unread' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Unread
          </button>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="all">All Categories</option>
          <option value="order">Orders</option>
          <option value="prescription">Prescriptions</option>
          <option value="consultation">Consultations</option>
          <option value="system">System</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">No notifications to display</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg border p-4 transition-colors ${
                !notification.read 
                  ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          getCategoryBadgeColor(notification.category)
                        }`}>
                          {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">
                          {notification.date} at {notification.time}
                        </span>
                        {notification.actionUrl && (
                          <button
                            onClick={() => router.push(notification.actionUrl!)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            {notification.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Mark as read"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete notification"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}