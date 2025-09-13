'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface ShippingOption {
  frequency: string;
  default: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  frequency: string;
  discount: number;
  description: string;
}

interface Medication {
  id: string;
  sku: string;
  name: string;
  genericName: string;
  category: string;
  dosages: string[];
  basePrice: number;
  cost: number;
  stock: number;
  status: 'active' | 'inactive';
  plans: Plan[];
  shippingOptions: ShippingOption[];
}

export default function MedicationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      sku: 'TRE-025-CR',
      name: 'Tretinoin Cream',
      genericName: 'Tretinoin',
      category: 'acne',
      dosages: ['0.025%', '0.05%', '0.1%'],
      basePrice: 59,
      cost: 12,
      stock: 243,
      status: 'active',
      plans: [
        {
          id: 'p1',
          name: 'One-time Purchase',
          price: 59,
          frequency: 'once',
          discount: 0,
          description: 'Single purchase, no subscription'
        },
        {
          id: 'p2',
          name: 'Monthly Subscription',
          price: 49,
          frequency: 'monthly',
          discount: 17,
          description: 'Auto-refill every month, save 17%'
        },
        {
          id: 'p3',
          name: 'Quarterly Subscription',
          price: 44,
          frequency: 'quarterly',
          discount: 25,
          description: 'Auto-refill every 3 months, save 25%'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '60 days', default: false },
        { frequency: '90 days', default: false }
      ]
    },
    {
      id: '2',
      sku: 'DOX-100-CAP',
      name: 'Doxycycline',
      genericName: 'Doxycycline',
      category: 'acne',
      dosages: ['50mg', '100mg'],
      basePrice: 4,
      cost: 0.80,
      stock: 1250,
      status: 'active',
      plans: [
        {
          id: 'p4',
          name: 'One-time Purchase',
          price: 4,
          frequency: 'once',
          discount: 0,
          description: 'Per pill pricing'
        },
        {
          id: 'p5',
          name: 'Monthly Supply (30 pills)',
          price: 99,
          frequency: 'monthly',
          discount: 17,
          description: '30-day supply, auto-refill'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '60 days', default: false }
      ]
    },
    {
      id: '3',
      sku: 'FIN-1-TAB',
      name: 'Finasteride',
      genericName: 'Finasteride',
      category: 'hairLoss',
      dosages: ['1mg', '5mg'],
      basePrice: 2,
      cost: 0.30,
      stock: 5000,
      status: 'active',
      plans: [
        {
          id: 'p6',
          name: 'Monthly Supply',
          price: 20,
          frequency: 'monthly',
          discount: 0,
          description: '30 tablets per month'
        },
        {
          id: 'p7',
          name: '3-Month Supply',
          price: 54,
          frequency: 'quarterly',
          discount: 10,
          description: '90 tablets, save 10%'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '90 days', default: false }
      ]
    },
    {
      id: '4',
      sku: 'SIL-50-TAB',
      name: 'Sildenafil',
      genericName: 'Sildenafil Citrate',
      category: 'ed',
      dosages: ['25mg', '50mg', '100mg'],
      basePrice: 10,
      cost: 1.50,
      stock: 80,
      status: 'active',
      plans: [
        {
          id: 'p9',
          name: '4 Tablets',
          price: 40,
          frequency: 'once',
          discount: 0,
          description: 'One-time purchase'
        },
        {
          id: 'p10',
          name: '8 Tablets Monthly',
          price: 64,
          frequency: 'monthly',
          discount: 20,
          description: 'Monthly subscription, save 20%'
        }
      ],
      shippingOptions: [
        { frequency: 'On demand', default: true },
        { frequency: '30 days', default: false }
      ]
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Medications', count: medications.length },
    { id: 'acne', name: 'Acne', count: medications.filter(m => m.category === 'acne').length },
    { id: 'hairLoss', name: 'Hair Loss', count: medications.filter(m => m.category === 'hairLoss').length },
    { id: 'ed', name: 'ED', count: medications.filter(m => m.category === 'ed').length },
    { id: 'weightLoss', name: 'Weight Loss', count: 0 }
  ];

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
        router.push('/portal/dashboard');
        return;
      }
    }

    setLoading(false);
  }, [router]);

  const filteredMedications = medications.filter(med => {
    const matchesCategory = selectedCategory === 'all' || med.category === selectedCategory;
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleManagePlans = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowPlanModal(true);
  };

  const calculateInventoryValue = () => {
    return medications.reduce((sum, med) => sum + (med.stock * med.cost), 0);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Medication Database</h1>
          <p className="text-gray-600 mt-1">Manage medications, pricing plans, and shipping frequencies</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          + Add Medication
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
          <p className="text-xs text-green-600 mt-1">Active medications</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Avg Plans/Med</p>
          <p className="text-2xl font-bold text-green-600">3</p>
          <p className="text-xs text-gray-500 mt-1">Subscription options</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">
            {medications.filter(m => m.stock < 100).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Need reorder</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">0</p>
          <p className="text-xs text-gray-500 mt-1">Unavailable</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900">
            ${calculateInventoryValue().toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total value</p>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <div className="w-64">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex justify-between items-center transition ${
                    selectedCategory === cat.id
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-sm">{cat.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedCategory === cat.id ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Medications Table */}
        <div className="flex-1">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Search medications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={() => alert('Import CSV functionality')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Import CSV
                  </button>
                  <button 
                    onClick={() => alert('Export functionality')}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plans</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredMedications.map(med => (
                    <tr key={med.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{med.sku}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-xs text-gray-500">{med.genericName}</p>
                          <p className="text-xs text-gray-500">{med.dosages.join(', ')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{med.plans.length} plans</p>
                          <p className="text-xs text-gray-500">
                            {med.shippingOptions.map(s => s.frequency).join(', ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            ${Math.min(...med.plans.map(p => p.price))} - ${Math.max(...med.plans.map(p => p.price))}
                          </p>
                          <p className="text-xs text-gray-500">Cost: ${med.cost}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${med.stock < 100 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {med.stock.toLocaleString()}
                        </span>
                        {med.stock < 100 && (
                          <p className="text-xs text-orange-600">Low stock</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => handleManagePlans(med)}
                          className="text-gray-600 hover:text-gray-900 mr-3"
                        >
                          Manage Plans
                        </button>
                        <button 
                          onClick={() => alert(`Edit ${med.name}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Manage Plans Modal */}
      {showPlanModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage Plans for {selectedMedication.name}
            </h3>
            
            <div className="space-y-6">
              {/* Current Plans */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Subscription Plans</h4>
                <div className="space-y-3">
                  {selectedMedication.plans.map((plan) => (
                    <Card key={plan.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.description}</p>
                          <p className="text-sm mt-1">
                            Frequency: <span className="font-medium">{plan.frequency}</span> | 
                            Price: <span className="font-medium text-green-600">${plan.price}</span>
                            {plan.discount > 0 && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {plan.discount}% off
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-sm text-gray-600 hover:text-gray-900">Edit</button>
                          <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Shipping Frequency Options</h4>
                <div className="space-y-2">
                  {selectedMedication.shippingOptions.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={option.default}
                          onChange={() => {}}
                          className="mr-3"
                        />
                        <span className="text-sm">{option.frequency}</span>
                        {option.default && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <button className="text-sm text-gray-600 hover:text-gray-700">
                        Remove
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400">
                    + Add Shipping Option
                  </button>
                </div>
              </div>

              {/* Add New Plan */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Add New Plan</h4>
                <Card className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
                        <option>Once</option>
                        <option>Monthly</option>
                        <option>Bi-monthly</option>
                        <option>Quarterly</option>
                        <option>Biannual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                  </div>
                  <button className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                    Add Plan
                  </button>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  alert('Plans updated!');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Medication</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" placeholder="e.g., TRE-025-CR" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
                    <option>Acne</option>
                    <option>Hair Loss</option>
                    <option>ED</option>
                    <option>Weight Loss</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Dosages</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" placeholder="Comma separated (e.g., 25mg, 50mg, 100mg)" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" rows={3} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warnings</label>
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" rows={2} />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  alert('Medication added!');
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Add Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
