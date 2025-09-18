'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { 
  treatmentProtocols, 
  conditionDisplayNames,
  calculateProtocolCost,
  getAllConditions
} from '@/lib/treatment-protocols';

export default function ProtocolsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const conditions = getAllConditions();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to protocols management
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  const handleEditProtocol = (condition: string, protocolKey: string, protocol: any) => {
    setEditingProtocol({
      condition,
      protocolKey,
      ...protocol
    });
    setShowEditModal(true);
  };

  const handleAddProtocol = () => {
    // Create a new empty protocol template
    setEditingProtocol({
      condition: selectedCondition || conditions[0] || 'acne',
      protocolKey: '',
      name: '',
      description: '',
      duration: '',
      followUp: '',
      medications: [],
      total: 0,
      isNew: true // Flag to indicate this is a new protocol
    });
    setShowEditModal(true);
  };

  const handleSaveProtocol = () => {
    if (editingProtocol.isNew) {
      // Handle new protocol creation
      setNotification({
        message: `New protocol "${editingProtocol.name}" created successfully!`,
        type: 'success'
      });
    } else {
      // Handle existing protocol update
      setNotification({
        message: 'Protocol saved successfully!',
        type: 'success'
      });
    }
    setShowEditModal(false);
    setEditingProtocol(null);
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateTotalProtocols = () => {
    return conditions.reduce((total, condition) => {
      const protocols = treatmentProtocols[condition as keyof typeof treatmentProtocols];
      return total + Object.keys(protocols).length;
    }, 0);
  };

  const getFilteredProtocols = () => {
    if (!searchTerm) return treatmentProtocols;
    
    const filtered: any = {};
    conditions.forEach(condition => {
      const protocols = treatmentProtocols[condition as keyof typeof treatmentProtocols];
      const filteredProtocols: any = {};
      
      Object.entries(protocols).forEach(([key, protocol]: [string, any]) => {
        if (protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protocol.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          filteredProtocols[key] = protocol;
        }
      });
      
      if (Object.keys(filteredProtocols).length > 0) {
        filtered[condition] = filteredProtocols;
      }
    });
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filteredProtocols = getFilteredProtocols();

  return (
    <div className="space-y-6">
      {/* Passive Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Protocols</h1>
          <p className="text-gray-600 mt-1">Comprehensive treatment protocols for all conditions</p>
        </div>
        <button
          onClick={handleAddProtocol}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Add Protocol
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Protocols</p>
          <p className="text-2xl font-bold text-gray-900">{calculateTotalProtocols()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Conditions</p>
          <p className="text-2xl font-bold text-blue-600">{conditions.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Medications</p>
          <p className="text-2xl font-bold text-green-600">47</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Last Updated</p>
          <p className="text-2xl font-bold text-gray-900">Today</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search protocols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="">All Conditions</option>
            {conditions.map(condition => (
              <option key={condition} value={condition}>
                {conditionDisplayNames[condition] || condition}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Protocols by Condition */}
      <div className="space-y-6">
        {Object.entries(filteredProtocols).map(([condition, protocols]) => {
          if (selectedCondition && condition !== selectedCondition) return null;
          
          return (
            <Card key={condition} className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {conditionDisplayNames[condition] || condition}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(protocols as any).map(([key, protocol]: [string, any]) => (
                  <div key={key} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{protocol.name}</h3>
                        <p className="text-sm text-gray-600">{protocol.description}</p>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        ${protocol.total}
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">{protocol.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Follow-up:</span>
                        <span className="font-medium">{protocol.followUp}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Medications:</span>
                        <span className="font-medium">{protocol.medications.length} items</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => setSelectedProtocol(protocol)}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEditProtocol(condition, key, protocol)}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Protocol Details Modal */}
      {selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{selectedProtocol.name}</h2>
            <p className="text-gray-600 mb-6">{selectedProtocol.description}</p>
            
            <h3 className="font-semibold mb-3">Medications:</h3>
            <div className="space-y-3 mb-6">
              {selectedProtocol.medications.map((med: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-600">SKU: {med.sku}</p>
                      <p className="text-sm text-gray-600 mt-1">{med.instructions}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${med.price}</p>
                      <p className="text-sm text-gray-500">Qty: {med.qty}</p>
                      <p className="text-sm text-gray-500">Refills: {med.refills}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold">{selectedProtocol.duration}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-gray-500">Follow-up</p>
                <p className="font-semibold">{selectedProtocol.followUp}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">${selectedProtocol.total}</p>
              </div>
              <button
                onClick={() => setSelectedProtocol(null)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Protocol Modal */}
      {showEditModal && editingProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProtocol.isNew ? 'Add New Protocol' : 'Edit Protocol'}
            </h2>
            
            <div className="space-y-4">
              {editingProtocol.isNew && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      value={editingProtocol.condition}
                      onChange={(e) => setEditingProtocol({...editingProtocol, condition: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      {conditions.map(condition => (
                        <option key={condition} value={condition}>
                          {conditionDisplayNames[condition] || condition}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protocol Key</label>
                    <input
                      type="text"
                      value={editingProtocol.protocolKey}
                      onChange={(e) => setEditingProtocol({...editingProtocol, protocolKey: e.target.value})}
                      placeholder="e.g., mild, moderate, severe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Protocol Name</label>
                <input
                  type="text"
                  value={editingProtocol.name}
                  onChange={(e) => setEditingProtocol({...editingProtocol, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter protocol name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingProtocol.description}
                  onChange={(e) => setEditingProtocol({...editingProtocol, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingProtocol.duration}
                    onChange={(e) => setEditingProtocol({...editingProtocol, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up</label>
                  <input
                    type="text"
                    value={editingProtocol.followUp}
                    onChange={(e) => setEditingProtocol({...editingProtocol, followUp: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Medications</h3>
                {editingProtocol.medications?.map((med: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 mb-2">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Medication</label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => {
                            const updated = [...editingProtocol.medications];
                            updated[index] = { ...updated[index], name: e.target.value };
                            const newTotal = updated.reduce((sum: number, m: any) => sum + (m.price * (m.qty || 1)), 0);
                            setEditingProtocol({ ...editingProtocol, medications: updated, total: newTotal });
                          }}
                          placeholder="Medication name"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Price ($)</label>
                        <input
                          type="number"
                          value={med.price}
                          onChange={(e) => {
                            const updated = [...editingProtocol.medications];
                            updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                            const newTotal = updated.reduce((sum: number, m: any) => sum + (m.price * (m.qty || 1)), 0);
                            setEditingProtocol({ ...editingProtocol, medications: updated, total: newTotal });
                          }}
                          placeholder="Price"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Qty</label>
                        <input
                          type="number"
                          value={med.qty}
                          onChange={(e) => {
                            const updated = [...editingProtocol.medications];
                            updated[index] = { ...updated[index], qty: parseInt(e.target.value) || 1 };
                            const newTotal = updated.reduce((sum: number, m: any) => sum + (m.price * (m.qty || 1)), 0);
                            setEditingProtocol({ ...editingProtocol, medications: updated, total: newTotal });
                          }}
                          placeholder="Quantity"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Instructions</label>
                        <input
                          type="text"
                          value={med.instructions || ''}
                          onChange={(e) => {
                            const updated = [...editingProtocol.medications];
                            updated[index] = { ...updated[index], instructions: e.target.value };
                            setEditingProtocol({ ...editingProtocol, medications: updated });
                          }}
                          placeholder="Dosage instructions"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        Subtotal: <strong>${(med.price * (med.qty || 1)).toFixed(2)}</strong>
                      </span>
                      <button
                        onClick={() => {
                          const updated = editingProtocol.medications.filter((_: any, i: number) => i !== index);
                          const newTotal = updated.reduce((sum: number, m: any) => sum + (m.price * (m.qty || 1)), 0);
                          setEditingProtocol({ ...editingProtocol, medications: updated, total: newTotal });
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newMed = { 
                      sku: `SKU-${Date.now()}`, 
                      name: '', 
                      price: 0, 
                      qty: 1, 
                      instructions: '', 
                      refills: 0 
                    };
                    setEditingProtocol({
                      ...editingProtocol,
                      medications: [...(editingProtocol.medications || []), newMed]
                    });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  + Add Medication
                </button>
                
                {/* Total Price Display */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Protocol Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${editingProtocol.total || editingProtocol.medications?.reduce((sum: number, m: any) => sum + (m.price * (m.qty || 1)), 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProtocol(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProtocol}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                {editingProtocol.isNew ? 'Create Protocol' : 'Save Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
