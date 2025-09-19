'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import NotificationPopup from '@/components/NotificationPopup';
import ConfirmDialog from '@/components/ConfirmDialog';

type UserRole = 'provider' | 'admin' | 'provider-admin' | 'super-admin';

interface Partner {
  id: number;
  name: string;
  type: 'Primary' | 'Regional' | 'Backup';
  status: 'active' | 'standby';
  region: string;
  avgFulfillmentTime: string;
  successRate: string;
  monthlyVolume: number;
  apiEndpoint: string;
  capabilities: string[];
  states: string[];
  licensedStates: number;
}

interface ShippingZone {
  zone: string;
  states: string;
  baseRate: number;
  estimatedDays: string;
}

export default function PharmacyPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners');
  const [showStateModal, setShowStateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [selectedZoneStates, setSelectedZoneStates] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [zoneToDeleteIndex, setZoneToDeleteIndex] = useState<number | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  
  const [partners, setPartners] = useState<Partner[]>([
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
      states: ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
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

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([
    { zone: 'Zone 1', states: 'CA, OR, WA, NV', baseRate: 5.99, estimatedDays: '1-2' },
    { zone: 'Zone 2', states: 'AZ, UT, ID, MT', baseRate: 7.99, estimatedDays: '2-3' },
    { zone: 'Zone 3', states: 'CO, NM, WY, TX', baseRate: 9.99, estimatedDays: '3-4' },
    { zone: 'Zone 4', states: 'Rest of US', baseRate: 11.99, estimatedDays: '4-5' },
  ]);

  // Default/mock settings
  const defaultProcessingSettings = {
    autoRoutingEnabled: true,
    priorityThreshold: 24,
    maxRetries: 3,
    batchProcessingTime: '14:00',
    weekendProcessing: false,
  };

  const [processingSettings, setProcessingSettings] = useState(defaultProcessingSettings);

  const allStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to pharmacy management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setUserRole(role);
      
      // Always start with default/mock settings on page refresh
      // Settings are only temporarily saved to cache but not loaded on refresh
      setProcessingSettings(defaultProcessingSettings);
      
      setLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  const handleTogglePartnerStatus = (partnerId: number) => {
    setPartners(partners.map(p => 
      p.id === partnerId 
        ? { ...p, status: p.status === 'active' ? 'standby' : 'active' }
        : p
    ));
  };

  const handleSaveProcessingSettings = () => {
    try {
      // Save current settings to localStorage (cache only, will reset to defaults on refresh)
      localStorage.setItem('pharmacyProcessingSettings', JSON.stringify(processingSettings));
      localStorage.setItem('pharmacyProcessingSettingsTimestamp', new Date().toISOString());
      
      // Passive success message
      setToast({ type: 'success', text: 'Processing settings saved (cached until refresh).' });
      
      console.log('Saved processing settings to cache:', processingSettings);
    } catch (error) {
      console.error('Error saving processing settings:', error);
      setToast({ type: 'error', text: 'Error saving settings. Please try again.' });
    }
  };

  const handleResetProcessingSettings = () => {
    setShowResetConfirm(true);
  };

  // Check if current settings differ from defaults
  const hasModifiedSettings = () => {
    return JSON.stringify(processingSettings) !== JSON.stringify(defaultProcessingSettings);
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
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Management</h1>
          <p className="text-gray-600 mt-1">Configure fulfillment partners and settings</p>
        </div>
        <button
          onClick={() => setShowAddPartnerModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Add Partner
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['partners', 'shipping', 'processing', 'costs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'partners' && 'Fulfillment Partners'}
              {tab === 'shipping' && 'Shipping Zones'}
              {tab === 'processing' && 'Processing Settings'}
              {tab === 'costs' && 'Cost Analysis'}
            </button>
          ))}
        </nav>
      </div>

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          {partners.map((partner) => (
            <Card key={partner.id} className="p-6">
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
                  <button 
                    onClick={() => setToast({ type: 'success', text: 'API connection test initiated.' })}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Test API
                  </button>
                  <button
                    onClick={() => setPartnerToDelete(partner)}
                    className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Shipping Zones Tab */}
      {activeTab === 'shipping' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Shipping Zones Configuration</h2>
              <button
                onClick={() => {
                  setEditingZone(null);
                  setSelectedZoneStates([]);
                  setShowZoneModal(true);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm"
              >
                Add Zone
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">States</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => {
                              setEditingZone(zone);
                              setSelectedZoneStates(zone.states.split(', ').filter(s => s));
                              setShowZoneModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900">Edit</button>
                          <button 
                            onClick={() => setZoneToDeleteIndex(index)}
                            className="text-red-600 hover:text-red-900">Delete</button>
                        </div>
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
        </Card>
      )}

      {/* Processing Settings Tab */}
      {activeTab === 'processing' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Processing Configuration</h2>
            <div className="text-sm text-gray-500">
              {hasModifiedSettings() ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-orange-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modified settings (unsaved)
                </span>
              ) : localStorage.getItem('pharmacyProcessingSettings') ? (
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Settings cached (resets on refresh)
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Using default settings
                </span>
              )}
            </div>
          </div>
          
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
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
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

            <div className="pt-4 flex space-x-3">
              <button 
                onClick={handleSaveProcessingSettings}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Save Settings
              </button>
              <button 
                onClick={handleResetProcessingSettings}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Monthly Fulfillment Cost</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">$8,234</p>
              <p className="text-sm text-green-600 mt-1">-12% from last month</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Average Cost per Order</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">$4.23</p>
              <p className="text-sm text-green-600 mt-1">-$0.45 from last month</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Shipping Revenue</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">$2,156</p>
              <p className="text-sm text-gray-500 mt-1">26% of fulfillment cost</p>
            </Card>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown by Partner</h2>
            <div className="space-y-4">
              {partners.map((partner) => (
                <div key={partner.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{partner.name}</p>
                    <div className="mt-1 flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div 
                          className="bg-gray-900 h-2 rounded-full" 
                          style={{ width: `${(partner.monthlyVolume / 2000) * 100}%` }}
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
                      $4.23/order
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

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
                      onClick={() => {
                        const updatedStates = isActive
                          ? selectedPartner.states.filter(s => s !== state && s !== 'ALL')
                          : [...selectedPartner.states.filter(s => s !== 'ALL'), state];
                        
                        setSelectedPartner({
                          ...selectedPartner,
                          states: updatedStates,
                          licensedStates: updatedStates.length
                        });
                      }}
                      className={`px-3 py-2 text-sm rounded border transition-colors ${
                        isActive
                          ? 'bg-gray-900 border-gray-900 text-white'
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
                  if (selectedPartner) {
                    setPartners(partners.map(p => 
                      p.id === selectedPartner.id ? selectedPartner : p
                    ));
                  }
                  setShowStateModal(false);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddPartnerModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Fulfillment Partner</h3>
                  <button
                    onClick={() => setShowAddPartnerModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  
                  const newPartner: Partner = {
                    id: Date.now(),
                    name: formData.get('name') as string,
                    type: formData.get('type') as 'Primary' | 'Regional' | 'Backup',
                    status: 'standby',
                    region: formData.get('region') as string,
                    avgFulfillmentTime: 'N/A',
                    successRate: 'N/A',
                    monthlyVolume: 0,
                    apiEndpoint: formData.get('apiEndpoint') as string,
                    capabilities: [],
                    states: [],
                    licensedStates: 0
                  };
                  
                  setPartners(prev => [...prev, newPartner]);
                  setShowAddPartnerModal(false);
                }}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g., QuickMeds Pharmacy"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner Type</label>
                        <select
                          name="type"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="Primary">Primary</option>
                          <option value="Regional">Regional</option>
                          <option value="Backup">Backup</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <select
                          name="region"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="National">National</option>
                          <option value="West Coast">West Coast</option>
                          <option value="East Coast">East Coast</option>
                          <option value="Midwest">Midwest</option>
                          <option value="South">South</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                      <input
                        type="url"
                        name="apiEndpoint"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="https://api.pharmacy.com/v2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                      <input
                        type="email"
                        name="contactEmail"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="contact@pharmacy.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capabilities</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" name="cap_same_day" className="mr-2 rounded" />
                          <span className="text-sm">Same-day processing</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" name="cap_cold_chain" className="mr-2 rounded" />
                          <span className="text-sm">Cold chain</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" name="cap_controlled" className="mr-2 rounded" />
                          <span className="text-sm">Controlled substances</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddPartnerModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      Add Partner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowZoneModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
                  </h3>
                  <button
                    onClick={() => setShowZoneModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  
                  if (selectedZoneStates.length === 0) {
                    setToast({ type: 'error', text: 'Please select at least one state for the zone.' });
                    return;
                  }
                  
                  const formData = new FormData(e.target as HTMLFormElement);
                  
                  const zoneData: ShippingZone = {
                    zone: formData.get('zone') as string,
                    states: selectedZoneStates.join(', '),
                    baseRate: parseFloat(formData.get('baseRate') as string),
                    estimatedDays: formData.get('estimatedDays') as string
                  };
                  
                  if (editingZone) {
                    setShippingZones(shippingZones.map((z, i) => 
                      z === editingZone ? zoneData : z
                    ));
                  } else {
                    setShippingZones([...shippingZones, zoneData]);
                  }
                  
                  setShowZoneModal(false);
                  setEditingZone(null);
                  setSelectedZoneStates([]);
                }}>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                      <input
                        type="text"
                        name="zone"
                        defaultValue={editingZone?.zone}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g., Zone 1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        States ({selectedZoneStates.length} selected)
                      </label>
                      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-6 gap-1">
                          {allStates.map((state) => {
                            const isSelected = selectedZoneStates.includes(state);
                            return (
                              <button
                                key={state}
                                type="button"
                                onClick={() => {
                                  setSelectedZoneStates(prev =>
                                    isSelected
                                      ? prev.filter(s => s !== state)
                                      : [...prev, state]
                                  );
                                }}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-gray-900 border-gray-900 text-white'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {state}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {selectedZoneStates.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Please select at least one state</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate ($)</label>
                      <input
                        type="number"
                        name="baseRate"
                        step="0.01"
                        defaultValue={editingZone?.baseRate}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery (days)</label>
                      <select
                        name="estimatedDays"
                        defaultValue={editingZone?.estimatedDays}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      >
                        <option value="1-2">1-2</option>
                        <option value="2-3">2-3</option>
                        <option value="3-5">3-5</option>
                        <option value="5-7">5-7</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowZoneModal(false);
                        setEditingZone(null);
                        setSelectedZoneStates([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      {editingZone ? 'Update Zone' : 'Add Zone'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Passive Notification */}
      <NotificationPopup message={toast} onClose={() => setToast(null)} />

      {/* Confirm: Reset Processing Settings */}
      <ConfirmDialog
        open={showResetConfirm}
        title="Reset processing settings?"
        description="This will revert all processing settings back to their default values."
        confirmText="Reset"
        tone="danger"
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={() => {
          // Remove from localStorage cache and reset to defaults
          localStorage.removeItem('pharmacyProcessingSettings');
          localStorage.removeItem('pharmacyProcessingSettingsTimestamp');
          setProcessingSettings(defaultProcessingSettings);
          setShowResetConfirm(false);
          setToast({ type: 'success', text: 'Processing settings reset to defaults.' });
        }}
      />

      {/* Confirm: Delete Shipping Zone */}
      <ConfirmDialog
        open={zoneToDeleteIndex !== null}
        title="Delete shipping zone?"
        description="This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        onCancel={() => setZoneToDeleteIndex(null)}
        onConfirm={() => {
          if (zoneToDeleteIndex !== null) {
            setShippingZones(shippingZones.filter((_, i) => i !== zoneToDeleteIndex));
            setToast({ type: 'success', text: 'Shipping zone deleted.' });
          }
          setZoneToDeleteIndex(null);
        }}
      />

      {/* Confirm: Delete Partner */}
      <ConfirmDialog
        open={partnerToDelete !== null}
        title="Delete fulfillment partner?"
        description={`Remove ${partnerToDelete?.name} from partners list. This action cannot be undone.`}
        confirmText="Delete"
        tone="danger"
        onCancel={() => setPartnerToDelete(null)}
        onConfirm={() => {
          if (partnerToDelete) {
            setPartners(partners.filter(p => p.id !== partnerToDelete.id));
            setToast({ type: 'success', text: 'Partner deleted.' });
          }
          setPartnerToDelete(null);
        }}
      />
    </div>
  );
}
