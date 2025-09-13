'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMedications() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [medications, setMedications] = useState([
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
        },
        {
          id: 'p8',
          name: '6-Month Supply',
          price: 96,
          frequency: 'biannual',
          discount: 20,
          description: '180 tablets, save 20%'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true },
        { frequency: '90 days', default: false },
        { frequency: '180 days', default: false }
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
      stock: 800,
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
        },
        {
          id: 'p11',
          name: '16 Tablets Monthly',
          price: 112,
          frequency: 'monthly',
          discount: 30,
          description: 'Monthly subscription, save 30%'
        }
      ],
      shippingOptions: [
        { frequency: 'On demand', default: true },
        { frequency: '30 days', default: false },
        { frequency: '60 days', default: false }
      ]
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Medications', count: medications.length },
    { id: 'acne', name: 'Acne', count: 2 },
    { id: 'hairLoss', name: 'Hair Loss', count: 1 },
    { id: 'ed', name: 'ED', count: 1 },
    { id: 'weightLoss', name: 'Weight Loss', count: 0 }
  ];

  const filteredMedications = selectedCategory === 'all' 
    ? medications 
    : medications.filter(m => m.category === selectedCategory);

  const handleManagePlans = (medication: any) => {
    setSelectedMedication(medication);
    setShowPlanModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <nav className="flex space-x-4">
                <button className="px-3 py-1 bg-gray-800 rounded text-sm">Medications</button>
                <button onClick={() => router.push('/admin/plans')} className="px-3 py-1 hover:bg-gray-800 rounded text-sm">Plans</button>
                <button onClick={() => router.push('/admin/pharmacy')} className="px-3 py-1 hover:bg-gray-800 rounded text-sm">Pharmacy</button>
                <button onClick={() => router.push('/admin/forms')} className="px-3 py-1 hover:bg-gray-800 rounded text-sm">Service Forms</button>
                <button onClick={() => router.push('/admin/settings')} className="px-3 py-1 hover:bg-gray-800 rounded text-sm">Settings</button>
              </nav>
            </div>
            <button 
              onClick={() => router.push('/provider/dashboard')}
              className="text-sm hover:text-gray-300"
            >
              Back to Provider Portal →
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Medication Database</h2>
            <p className="text-gray-600 mt-1">Manage medications, pricing plans, and shipping frequencies</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Medication
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total SKUs</p>
            <p className="text-2xl font-bold text-gray-900">{medications.length}</p>
            <p className="text-xs text-green-600 mt-1">Active medications</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Avg Plans/Med</p>
            <p className="text-2xl font-bold text-green-600">3</p>
            <p className="text-xs text-gray-500 mt-1">Subscription options</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500 mt-1">Need reorder</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">$124,500</p>
            <p className="text-xs text-gray-500 mt-1">Inventory value</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Categories Sidebar */}
          <div className="w-64">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex justify-between items-center ${
                      selectedCategory === cat.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{cat.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Medications Table */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Search medications..."
                    className="px-4 py-2 border rounded-lg w-64"
                  />
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                      Import CSV
                    </button>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                      Export
                    </button>
                  </div>
                </div>
              </div>
              
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plans</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shipping</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
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
                            ${Math.min(...med.plans.map(p => p.price))} - ${Math.max(...med.plans.map(p => p.price))}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <p className="text-xs">{med.shippingOptions.map(s => s.frequency).join(', ')}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium ${med.stock < 100 ? 'text-orange-600' : 'text-gray-900'}`}>
                          {med.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button 
                          onClick={() => handleManagePlans(med)}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          Manage Plans
                        </button>
                        <button className="text-gray-600 hover:text-gray-700">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
              {/* Existing Plans */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Subscription Plans</h4>
                <div className="space-y-3">
                  {selectedMedication.plans.map((plan: any) => (
                    <div key={plan.id} className="border rounded-lg p-4">
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
                          <button className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
                          <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Shipping Frequency Options</h4>
                <div className="space-y-2">
                  {selectedMedication.shippingOptions.map((option: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
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
                  <button className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded hover:border-gray-400">
                    + Add Shipping Option
                  </button>
                </div>
              </div>

              {/* Add New Plan */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Add New Plan</h4>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>Once</option>
                        <option>Monthly</option>
                        <option>Bi-monthly</option>
                        <option>Quarterly</option>
                        <option>Biannual</option>
                        <option>Annual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                      <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add Plan
                  </button>
                </div>
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
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., TRE-025-CR" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>Acne</option>
                    <option>Hair Loss</option>
                    <option>ED</option>
                    <option>Weight Loss</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Dosages</label>
                <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Comma separated (e.g., 25mg, 50mg, 100mg)" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warnings</label>
                <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} />
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
