'use client';

import { useState } from 'react';
import { treatmentProtocols, conditionDisplayNames } from '@/lib/treatment-protocols';

export default function AdminProtocols() {
  const [selectedCondition, setSelectedCondition] = useState('acne');
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const conditions = Object.keys(treatmentProtocols);
  const protocols = treatmentProtocols[selectedCondition as keyof typeof treatmentProtocols];

  const handleEditProtocol = (protocolKey: string) => {
    const protocol = protocols[protocolKey as keyof typeof protocols];
    if (protocol) {
      setEditingProtocol({
        key: protocolKey,
        ...(protocol as any)
      });
    }
  };

  const handleSaveProtocol = () => {
    // In a real app, this would save to the database
    alert('Protocol saved! (This would save to database in production)');
    setEditingProtocol(null);
  };

  const handleAddMedication = () => {
    if (editingProtocol) {
      const newMed = {
        sku: '',
        name: '',
        price: 0,
        qty: 30,
        instructions: '',
        refills: 0
      };
      setEditingProtocol({
        ...editingProtocol,
        medications: [...editingProtocol.medications, newMed]
      });
    }
  };

  const handleRemoveMedication = (index: number) => {
    if (editingProtocol) {
      const meds = [...editingProtocol.medications];
      meds.splice(index, 1);
      setEditingProtocol({
        ...editingProtocol,
        medications: meds
      });
    }
  };

  const handleMedicationChange = (index: number, field: string, value: any) => {
    if (editingProtocol) {
      const meds = [...editingProtocol.medications];
      meds[index] = {
        ...meds[index],
        [field]: field === 'price' || field === 'qty' || field === 'refills' ? Number(value) : value
      };
      
      // Recalculate total
      const total = meds.reduce((sum, med) => sum + (med.price * med.qty), 0);
      
      setEditingProtocol({
        ...editingProtocol,
        medications: meds,
        total
      });
    }
  };

  const handleCreateNewProtocol = () => {
    setIsCreatingNew(true);
    setEditingProtocol({
      key: 'new_protocol',
      name: 'New Protocol',
      description: '',
      medications: [],
      duration: '',
      followUp: '',
      total: 0
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Treatment Protocol Management</h1>
        <p className="text-sm text-gray-500 mt-1">Configure and manage treatment protocols for different conditions</p>
      </div>

      {/* Condition Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {conditions.map((condition) => (
            <button
              key={condition}
              onClick={() => {
                setSelectedCondition(condition);
                setSelectedProtocol(null);
                setEditingProtocol(null);
                setIsCreatingNew(false);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedCondition === condition
                  ? 'border-medical-600 text-medical-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {conditionDisplayNames[condition]}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Protocol List */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Protocols</h3>
              <button
                onClick={handleCreateNewProtocol}
                className="px-3 py-1 bg-medical-600 text-white text-sm rounded hover:bg-medical-700"
              >
                + Add New
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {Object.entries(protocols).map(([key, protocol]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedProtocol(key);
                    handleEditProtocol(key);
                    setIsCreatingNew(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                    selectedProtocol === key ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{protocol.name}</p>
                      <p className="text-sm text-gray-500">{protocol.medications.length} medications</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">${protocol.total}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Protocol Editor */}
        <div className="col-span-2">
          {editingProtocol ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {isCreatingNew ? 'Create New Protocol' : 'Edit Protocol'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Protocol Name</label>
                      <input
                        type="text"
                        value={editingProtocol.name}
                        onChange={(e) => setEditingProtocol({ ...editingProtocol, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <input
                        type="text"
                        value={editingProtocol.duration}
                        onChange={(e) => setEditingProtocol({ ...editingProtocol, duration: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={editingProtocol.description}
                      onChange={(e) => setEditingProtocol({ ...editingProtocol, description: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Follow-up Schedule</label>
                    <input
                      type="text"
                      value={editingProtocol.followUp}
                      onChange={(e) => setEditingProtocol({ ...editingProtocol, followUp: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-medical-500 focus:border-medical-500"
                    />
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Medications</h4>
                    <button
                      onClick={handleAddMedication}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      + Add Medication
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingProtocol.medications.map((med: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="text-sm font-medium text-gray-700">Medication {index + 1}</h5>
                          <button
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700">SKU</label>
                            <input
                              type="text"
                              value={med.sku}
                              onChange={(e) => handleMedicationChange(index, 'sku', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700">Name</label>
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700">Price ($)</label>
                            <input
                              type="number"
                              value={med.price}
                              onChange={(e) => handleMedicationChange(index, 'price', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700">Quantity</label>
                            <input
                              type="number"
                              value={med.qty}
                              onChange={(e) => handleMedicationChange(index, 'qty', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700">Refills</label>
                            <input
                              type="number"
                              value={med.refills}
                              onChange={(e) => handleMedicationChange(index, 'refills', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700">Subtotal</label>
                            <div className="mt-1 py-1 px-2 bg-gray-100 rounded text-sm font-medium">
                              ${(med.price * med.qty).toFixed(2)}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700">Instructions</label>
                            <input
                              type="text"
                              value={med.instructions}
                              onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {editingProtocol.medications.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No medications added yet</p>
                      <button
                        onClick={handleAddMedication}
                        className="mt-2 text-medical-600 hover:text-medical-700 text-sm font-medium"
                      >
                        Add your first medication
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Cost */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Protocol Cost:</span>
                    <span className="text-2xl font-bold text-green-600">${editingProtocol.total}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setEditingProtocol(null);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProtocol}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-medical-600 hover:bg-medical-700"
                  >
                    {isCreatingNew ? 'Create Protocol' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No protocol selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a protocol from the list to edit, or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Conditions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{conditions.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Total Protocols</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {conditions.reduce((sum, c) => sum + Object.keys(treatmentProtocols[c as keyof typeof treatmentProtocols]).length, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Active Medications</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">142</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-600">Avg Protocol Cost</p>
          <p className="text-2xl font-bold text-green-600 mt-1">$127</p>
        </div>
      </div>
    </div>
  );
}
