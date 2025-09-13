'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPharmacyPage() {
  const [activeTab, setActiveTab] = useState('partners');
  const [partners, setPartners] = useState([
    {
      id: 1,
      name: 'QuickMeds Pharmacy',
      type: 'Primary',
      status: 'active',
      region: 'National',
      avgFulfillmentTime: '2.3 days',
      successRate: '99.2%',
      monthlyVolume: 1234,
      apiEndpoint: 'https://api.quickmeds.com/v2',
      capabilities: ['Same-day processing', 'Cold chain', 'Controlled substances'],
      states: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT', 'IA', 'NV', 'AR', 'MS', 'KS', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH', 'ME', 'MT', 'RI', 'DE', 'SD', 'ND', 'AK', 'VT', 'WY'],
      licensedStates: 48,
    },
    {
      id: 2,
      name: 'Regional Health Pharmacy',
      type: 'Regional',
      status: 'active',
      region: 'West Coast',
      avgFulfillmentTime: '1.8 days',
      successRate: '98.7%',
      monthlyVolume: 567,
      apiEndpoint: 'https://api.regionalhealth.com',
      capabilities: ['Next-day delivery', 'Compounding'],
      states: ['CA', 'WA', 'OR', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM'],
      licensedStates: 11,
    },
    {
      id: 3,
      name: 'Express Scripts',
      type: 'Backup',
      status: 'standby',
      region: 'National',
      avgFulfillmentTime: '3.1 days',
      successRate: '97.5%',
      monthlyVolume: 89,
      apiEndpoint: 'https://api.express-scripts.com',
      capabilities: ['Mail order', 'Specialty medications'],
      states: ['ALL'],
      licensedStates: 50,
    },
  ]);

  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  const [shippingZones, setShippingZones] = useState([
    { zone: 'Zone 1', states: 'CA, OR, WA, NV', baseRate: 5.99, estimatedDays: '1-2' },
    { zone: 'Zone 2', states: 'AZ, UT, ID, MT', baseRate: 7.99, estimatedDays: '2-3' },
    { zone: 'Zone 3', states: 'CO, NM, WY, TX', baseRate: 9.99, estimatedDays: '3-4' },
    { zone: 'Zone 4', states: 'Rest of US', baseRate: 11.99, estimatedDays: '4-5' },
  ]);

  const [processingSettings, setProcessingSettings] = useState({
    autoRoutingEnabled: true,
    priorityThreshold: 24,
    maxRetries: 3,
    batchProcessingTime: '14:00',
    weekendProcessing: false,
  });

  const handleAddPartner = () => {
    // Implementation for adding partner
  };

  const handleTogglePartnerStatus = (partnerId: number) => {
    setPartners(partners.map(p => 
      p.id === partnerId 
        ? { ...p, status: p.status === 'active' ? 'standby' : 'active' }
        : p
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pharmacy Management</h1>
              <p className="text-sm text-gray-500 mt-1">Configure fulfillment partners and settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleAddPartner}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Partner
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('partners')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'partners'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fulfillment Partners
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'shipping'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shipping Zones
            </button>
            <button
              onClick={() => setActiveTab('processing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'processing'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Processing Settings
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'costs'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cost Analysis
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="space-y-6">
            {partners.map((partner) => (
              <div key={partner.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                        partner.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {partner.status}
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {partner.type}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Region</p>
                        <p className="font-medium">{partner.region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg. Fulfillment</p>
                        <p className="font-medium">{partner.avgFulfillmentTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Success Rate</p>
                        <p className="font-medium text-green-600">{partner.successRate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Monthly Volume</p>
                        <p className="font-medium">{partner.monthlyVolume.toLocaleString()} orders</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Capabilities</p>
                      <div className="flex flex-wrap gap-2">
                        {partner.capabilities.map((cap, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">API Endpoint</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{partner.apiEndpoint}</code>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleTogglePartnerStatus(partner.id)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {partner.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedPartner(partner);
                        setShowStateModal(true);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Manage States
                    </button>
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                      Test API
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipping Zones Tab */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Zones Configuration</h2>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        States
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estimated Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shippingZones.map((zone, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {zone.zone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {zone.states}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${zone.baseRate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {zone.estimatedDays} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Free shipping automatically applies to orders over $50 or for subscription members.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Processing Settings Tab */}
        {activeTab === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Processing Configuration</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-Routing</label>
                  <p className="text-sm text-gray-500">Automatically route orders to best fulfillment partner</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processingSettings.autoRoutingEnabled}
                    onChange={(e) => setProcessingSettings({
                      ...processingSettings,
                      autoRoutingEnabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority Processing Threshold</label>
                <p className="text-sm text-gray-500 mb-2">Orders older than this will be prioritized (hours)</p>
                <input
                  type="number"
                  value={processingSettings.priorityThreshold}
                  onChange={(e) => setProcessingSettings({
                    ...processingSettings,
                    priorityThreshold: parseInt(e.target.value)
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Retry Attempts</label>
                <p className="text-sm text-gray-500 mb-2">Number of times to retry failed fulfillment</p>
                <input
                  type="number"
                  value={processingSettings.maxRetries}
                  onChange={(e) => setProcessingSettings({
                    ...processingSettings,
                    maxRetries: parseInt(e.target.value)
                  })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Processing Time</label>
                <p className="text-sm text-gray-500 mb-2">Daily time to process batch orders</p>
                <input
                  type="time"
                  value={processingSettings.batchProcessingTime}
                  onChange={(e) => setProcessingSettings({
                    ...processingSettings,
                    batchProcessingTime: e.target.value
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Weekend Processing</label>
                  <p className="text-sm text-gray-500">Process orders on weekends</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processingSettings.weekendProcessing}
                    onChange={(e) => setProcessingSettings({
                      ...processingSettings,
                      weekendProcessing: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-4">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cost Analysis Tab */}
        {activeTab === 'costs' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500">Monthly Fulfillment Cost</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">$8,234</p>
                <p className="text-sm text-green-600 mt-1">-12% from last month</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500">Average Cost per Order</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">$4.23</p>
                <p className="text-sm text-green-600 mt-1">-$0.45 from last month</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500">Shipping Revenue</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">$2,156</p>
                <p className="text-sm text-gray-500 mt-1">26% of fulfillment cost</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown by Partner</h2>
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{partner.name}</p>
                      <div className="mt-1 flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm text-gray-500">
                          {partner.monthlyVolume} orders
                        </span>
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <p className="font-semibold text-gray-900">
                        ${(partner.monthlyVolume * 4.23).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${(4.23).toFixed(2)}/order
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* State Management Modal */}
      {showStateModal && selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Manage State Coverage for {selectedPartner.name}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Currently licensed in {selectedPartner.licensedStates} states
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-10 gap-2">
                {allStates.map((state) => {
                  const isActive = selectedPartner.states.includes(state) || selectedPartner.states.includes('ALL');
                  return (
                    <button
                      key={state}
                      className={`px-3 py-2 text-sm rounded border ${
                        isActive
                          ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {state}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> State licensing requirements must be verified before enabling fulfillment in a new state.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowStateModal(false);
                  alert('State coverage updated!');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
