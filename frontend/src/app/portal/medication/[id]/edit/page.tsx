'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type FilterType = 'all' | 'acne' | 'hairLoss' | 'ed' | 'weightLoss';

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

export default function EditMedicationPage() {
  const router = useRouter();
  const params = useParams();
  const medicationId = params.id as string;
  const [medication, setMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/portal/login');
      return;
    }

    // Simulate fetching medication data
    setTimeout(() => {
      // Mock medication data - in a real app, this would be fetched from an API
      setMedication({
        id: medicationId,
        sku: 'TRE-025-CR',
        name: 'Tretinoin Cream',
        genericName: 'Tretinoin',
        category: 'acne',
        dosages: ['0.025%', '0.05%', '0.1%'],
        basePrice: 59,
        cost: 12,
        stock: 243,
        status: 'active',
        plans: [],
        shippingOptions: []
      });
      setLoading(false);
    }, 500);
  }, [medicationId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    const formData = new FormData(e.currentTarget);
    
    const updatedMedication: Medication = {
      ...medication!,
      sku: formData.get('sku') as string,
      name: formData.get('name') as string,
      genericName: formData.get('genericName') as string,
      category: formData.get('category') as FilterType,
      dosages: (formData.get('dosages') as string).split(',').map(d => d.trim()),
      basePrice: parseFloat(formData.get('basePrice') as string),
      cost: parseFloat(formData.get('cost') as string),
      stock: parseInt(formData.get('stock') as string),
      status: formData.get('status') as 'active' | 'inactive'
    };
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      router.push('/portal/medications');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Medication not found</p>
        <button
          onClick={() => router.push('/portal/medications')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Medications
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Edit Medication</h1>
          <p className="text-sm text-gray-500 mt-1">Update medication details</p>
        </div>
        <button
          onClick={() => router.push('/portal/medications')}
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                defaultValue={medication.sku}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                defaultValue={medication.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
              <input
                type="text"
                name="name"
                defaultValue={medication.name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
              <input
                type="text"
                name="genericName"
                defaultValue={medication.genericName}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                defaultValue={medication.category}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="acne">Acne</option>
                <option value="hairLoss">Hair Loss</option>
                <option value="ed">ED</option>
                <option value="weightLoss">Weight Loss</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosages (comma-separated)</label>
              <input
                type="text"
                name="dosages"
                defaultValue={medication.dosages.join(', ')}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 0.025%, 0.05%, 0.1%"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
              <input
                type="number"
                name="basePrice"
                step="0.01"
                defaultValue={medication.basePrice}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
              <input
                type="number"
                name="cost"
                step="0.01"
                defaultValue={medication.cost}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
              <input
                type="number"
                name="stock"
                defaultValue={medication.stock}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Calculated Fields */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Profit Margin:</span>
              <span className="ml-2 font-medium text-gray-900">
                {medication.basePrice && medication.cost ? 
                  `${(((medication.basePrice - medication.cost) / medication.basePrice) * 100).toFixed(1)}%` 
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Inventory Value:</span>
              <span className="ml-2 font-medium text-gray-900">
                ${(medication.stock * medication.cost).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Potential Revenue:</span>
              <span className="ml-2 font-medium text-gray-900">
                ${(medication.stock * medication.basePrice).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/portal/medications')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}