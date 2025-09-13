'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([
    {
      id: 'basic_monthly',
      name: 'Basic Plan',
      price: 29.99,
      interval: 'month',
      active: true,
      subscribers: 156,
      features: [
        'Unlimited consultations',
        '20% off medications',
        'Priority support',
        'Free shipping on all orders',
      ],
    },
    {
      id: 'premium_monthly',
      name: 'Premium Plan',
      price: 49.99,
      interval: 'month',
      active: true,
      subscribers: 89,
      features: [
        'Everything in Basic',
        '30% off medications',
        '24/7 provider access',
        'Same-day consultations',
        'Family member accounts (up to 4)',
      ],
    },
    {
      id: 'premium_annual',
      name: 'Premium Annual',
      price: 499.99,
      interval: 'year',
      active: true,
      subscribers: 34,
      features: [
        'All Premium features',
        '2 months free',
        'Annual health screening',
        'Dedicated care coordinator',
      ],
    },
  ]);

  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    interval: 'month',
    features: [''],
  });

  const handleEditPlan = (plan: any) => {
    setEditingPlan({ ...plan });
  };

  const handleSavePlan = () => {
    setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
    setEditingPlan(null);
  };

  const handleAddFeature = () => {
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, ''],
      });
    } else {
      setNewPlan({
        ...newPlan,
        features: [...newPlan.features, ''],
      });
    }
  };

  const handleCreatePlan = () => {
    const plan = {
      id: `${newPlan.name.toLowerCase().replace(/\s+/g, '_')}_${newPlan.interval}`,
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      interval: newPlan.interval,
      active: true,
      subscribers: 0,
      features: newPlan.features.filter(f => f.trim()),
    };
    setPlans([...plans, plan]);
    setShowAddModal(false);
    setNewPlan({
      name: '',
      price: '',
      interval: 'month',
      features: [''],
    });
  };

  const handleTogglePlan = (planId: string) => {
    setPlans(plans.map(p => 
      p.id === planId ? { ...p, active: !p.active } : p
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="text-sm text-gray-500 mt-1">Manage pricing and features</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add New Plan
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-sm border ${
                !plan.active ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.subscribers} subscribers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={plan.active}
                      onChange={() => handleTogglePlan(plan.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 ml-1">/{plan.interval}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    View Stats
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promotions Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Promotions</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">New Year Special - 20% off first month</p>
                <p className="text-sm text-gray-600">Code: NEWYEAR2024 • Expires: Jan 31, 2024</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600 font-medium">Active</span>
                <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Referral Program - $10 credit</p>
                <p className="text-sm text-gray-600">Ongoing promotion • 234 referrals this month</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600 font-medium">Active</span>
                <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400">
            + Add Promotion
          </button>
        </div>

        {/* Revenue Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Monthly Recurring Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">$12,456</p>
            <p className="text-sm text-green-600 mt-1">+18% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Average Revenue Per User</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">$42.30</p>
            <p className="text-sm text-green-600 mt-1">+5% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Churn Rate</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">2.3%</p>
            <p className="text-sm text-red-600 mt-1">+0.5% from last month</p>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {editingPlan.features.map((feature: string, index: number) => (
                  <input
                    key={index}
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...editingPlan.features];
                      newFeatures[index] = e.target.value;
                      setEditingPlan({ ...editingPlan, features: newFeatures });
                    }}
                    className="mb-2 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                ))}
                <button
                  onClick={handleAddFeature}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Add Feature
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Plan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Billing Interval</label>
                <select
                  value={newPlan.interval}
                  onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {newPlan.features.map((feature, index) => (
                  <input
                    key={index}
                    type="text"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...newPlan.features];
                      newFeatures[index] = e.target.value;
                      setNewPlan({ ...newPlan, features: newFeatures });
                    }}
                    className="mb-2 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter a feature"
                  />
                ))}
                <button
                  onClick={handleAddFeature}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  + Add Feature
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
