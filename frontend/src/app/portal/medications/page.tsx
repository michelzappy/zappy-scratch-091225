'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NotificationPopup from '@/components/NotificationPopup';
import ConfirmDialog from '@/components/ConfirmDialog';

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

type FilterType = 'all' | 'acne' | 'hairLoss' | 'ed' | 'weightLoss';

export default function MedicationsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<Set<string>>(new Set());
  const [stockFilter, setStockFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddShippingModal, setShowAddShippingModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newShippingFrequency, setNewShippingFrequency] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [medToDelete, setMedToDelete] = useState<Medication | null>(null);
  
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
    },
    {
      id: '5',
      sku: 'PHEN-375-TAB',
      name: 'Phentermine',
      genericName: 'Phentermine HCl',
      category: 'weightLoss',
      dosages: ['37.5mg'],
      basePrice: 3,
      cost: 0.50,
      stock: 45,
      status: 'active',
      plans: [
        {
          id: 'p11',
          name: 'Monthly Supply',
          price: 89,
          frequency: 'monthly',
          discount: 0,
          description: '30 tablets per month'
        }
      ],
      shippingOptions: [
        { frequency: '30 days', default: true }
      ]
    }
  ]);

  // Filter counts
  const filterCounts = {
    all: medications.length,
    acne: medications.filter(m => m.category === 'acne').length,
    hairLoss: medications.filter(m => m.category === 'hairLoss').length,
    ed: medications.filter(m => m.category === 'ed').length,
    weightLoss: medications.filter(m => m.category === 'weightLoss').length
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (!token) {
      router.push('/portal/login');
      return;
    }
    
    // Check if user has admin access
    if (role === 'provider') {
      // Regular providers don't have access to medications database
      router.push('/portal/dashboard');
      return;
    }
    
    // Admin, provider-admin, and super-admin can access
    if (role === 'admin' || role === 'provider-admin' || role === 'super-admin') {
      setUserRole(role);
      setLoading(false);
    } else {
      // Default redirect if no valid role
      router.push('/portal/dashboard');
    }
  }, [router]);

  // Apply filters
  let filteredMedications = medications.filter(med => {
    const matchesCategory = activeFilter === 'all' || med.category === activeFilter;
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = med.stock < 100 && med.stock > 0;
    } else if (stockFilter === 'out') {
      matchesStock = med.stock === 0;
    } else if (stockFilter === 'normal') {
      matchesStock = med.stock >= 100;
    }
    
    return matchesCategory && matchesSearch && matchesStock;
  });

  const toggleMedicationSelection = (medicationId: string) => {
    const newSelection = new Set(selectedMedications);
    if (newSelection.has(medicationId)) {
      newSelection.delete(medicationId);
    } else {
      newSelection.add(medicationId);
    }
    setSelectedMedications(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedMedications.size === filteredMedications.length) {
      setSelectedMedications(new Set());
    } else {
      setSelectedMedications(new Set(filteredMedications.map(m => m.id)));
    }
  };

  const exportMedications = () => {
    // Prepare data for export
    const dataToExport = selectedMedications.size > 0 
      ? filteredMedications.filter(m => selectedMedications.has(m.id))
      : filteredMedications;

    if (dataToExport.length === 0) {
      setToast({ type: 'error', text: 'No medications to export.' });
      return;
    }

    // Convert to CSV format
    const headers = ['SKU', 'Name', 'Generic Name', 'Category', 'Dosages', 'Base Price', 'Cost', 'Stock', 'Status', 'Plans'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(medication => [
        medication.sku,
        medication.name,
        medication.genericName,
        medication.category,
        `"${medication.dosages.join('; ')}"`,
        medication.basePrice.toFixed(2),
        medication.cost.toFixed(2),
        medication.stock,
        medication.status,
        `"${medication.plans.map(p => `${p.name} ($${p.price})`).join('; ')}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `medications_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const importMedications = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setToast({ type: 'error', text: 'Please select a CSV file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Expected headers: SKU, Name, Generic Name, Category, Dosages, Base Price, Cost, Stock, Status
        const requiredHeaders = ['SKU', 'Name', 'Generic Name', 'Category', 'Base Price', 'Cost', 'Stock'];
        const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.toLowerCase().includes(h.toLowerCase())));
        
        if (missingHeaders.length > 0) {
          setToast({ type: 'error', text: `Missing required columns: ${missingHeaders.join(', ')}` });
          return;
        }

        const importedMedications: Medication[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          const medication: Medication = {
            id: `imported-${Date.now()}-${i}`,
            sku: values[0] || '',
            name: values[1] || '',
            genericName: values[2] || '',
            category: values[3] || 'other',
            dosages: values[4] ? values[4].split(';').map(d => d.trim()) : [],
            basePrice: parseFloat(values[5]) || 0,
            cost: parseFloat(values[6]) || 0,
            stock: parseInt(values[7]) || 0,
            status: (values[8] as 'active' | 'inactive') || 'active',
            plans: [],
            shippingOptions: [{ frequency: 'monthly', default: true }]
          };
          
          if (medication.sku && medication.name) {
            importedMedications.push(medication);
          }
        }
        
        if (importedMedications.length > 0) {
          setMedications(prev => [...prev, ...importedMedications]);
          setToast({ type: 'success', text: `Imported ${importedMedications.length} medications.` });
        } else {
          setToast({ type: 'error', text: 'No valid medications found in the CSV file.' });
        }
        
      } catch (error) {
        console.error('Error importing CSV:', error);
        setToast({ type: 'error', text: 'Error importing CSV. Check the format and try again.' });
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Clear the input
  };

  const handleManagePlans = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowPlanModal(true);
  };

  const calculateInventoryValue = () => {
    return medications.reduce((sum, med) => sum + (med.stock * med.cost), 0);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
  };

  const handleRemovePlan = (planId: string) => {
    if (selectedMedication) {
      setMedications(prev => prev.map(med => 
        med.id === selectedMedication.id 
          ? { ...med, plans: med.plans.filter(p => p.id !== planId) }
          : med
      ));
      setSelectedMedication(prev => prev ? {
        ...prev,
        plans: prev.plans.filter(p => p.id !== planId)
      } : null);
      setToast({ type: 'success', text: 'Plan removed.' });
    }
  };

  const handleRemoveShippingOption = (index: number) => {
    if (selectedMedication) {
      const updatedOptions = selectedMedication.shippingOptions.filter((_, i) => i !== index);
      
      // Ensure at least one option remains default
      if (updatedOptions.length > 0 && !updatedOptions.some(opt => opt.default)) {
        updatedOptions[0].default = true;
      }
      
      setMedications(prev => prev.map(med => 
        med.id === selectedMedication.id 
          ? { ...med, shippingOptions: updatedOptions }
          : med
      ));
      setSelectedMedication(prev => prev ? {
        ...prev,
        shippingOptions: updatedOptions
      } : null);
      setToast({ type: 'success', text: 'Shipping option removed.' });
    }
  };

  const handleAddShippingOption = () => {
    if (newShippingFrequency.trim()) {
      const newOption: ShippingOption = {
        frequency: newShippingFrequency.trim(),
        default: selectedMedication?.shippingOptions.length === 0
      };
      
      if (selectedMedication) {
        setMedications(prev => prev.map(med => 
          med.id === selectedMedication.id 
            ? { ...med, shippingOptions: [...med.shippingOptions, newOption] }
            : med
        ));
        setSelectedMedication(prev => prev ? {
          ...prev,
          shippingOptions: [...prev.shippingOptions, newOption]
        } : null);
      }
      
      setNewShippingFrequency('');
      setShowAddShippingModal(false);
    }
  };

  const handleSetDefaultShipping = (index: number) => {
    if (selectedMedication) {
      const updatedOptions = selectedMedication.shippingOptions.map((opt, i) => ({
        ...opt,
        default: i === index
      }));
      
      setMedications(prev => prev.map(med => 
        med.id === selectedMedication.id 
          ? { ...med, shippingOptions: updatedOptions }
          : med
      ));
      setSelectedMedication(prev => prev ? {
        ...prev,
        shippingOptions: updatedOptions
      } : null);
    }
  };

  const handleUpdatePlan = (updatedPlan: Plan) => {
    if (selectedMedication) {
      setMedications(prev => prev.map(med => 
        med.id === selectedMedication.id 
          ? { ...med, plans: med.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p) }
          : med
      ));
      setSelectedMedication(prev => prev ? {
        ...prev,
        plans: prev.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      } : null);
      setEditingPlan(null);
    }
  };

  const lowStockCount = medications.filter(m => m.stock < 100 && m.stock > 0).length;
  const outOfStockCount = medications.filter(m => m.stock === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const filters = [
    { id: 'all', label: 'All Medications', count: filterCounts.all },
    { id: 'acne', label: 'Acne', count: filterCounts.acne },
    { id: 'hairLoss', label: 'Hair Loss', count: filterCounts.hairLoss },
    { id: 'ed', label: 'ED', count: filterCounts.ed },
    { id: 'weightLoss', label: 'Weight Loss', count: filterCounts.weightLoss }
  ];

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">Medication Database</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Inventory Value: <span className="font-semibold text-gray-900">${calculateInventoryValue().toLocaleString()}</span>
            {lowStockCount > 0 && (
              <>
                {' '}• <span className="font-semibold text-orange-600">{lowStockCount} low stock</span>
              </>
            )}
            {outOfStockCount > 0 && (
              <>
                {' '}• <span className="font-semibold text-red-600">{outOfStockCount} out</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Stripe-style Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activeFilter === filter.id
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {filter.label}
            <span className={`ml-1.5 ${activeFilter === filter.id ? 'text-gray-300' : 'text-gray-500'}`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Integrated Search and Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Stock Filter */}
        <select 
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <option value="">All Stock Levels</option>
          <option value="normal">Normal Stock</option>
          <option value="low">Low Stock (&lt;100)</option>
          <option value="out">Out of Stock</option>
        </select>

        {/* Status Filter */}
        <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* More Filters */}
        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          More filters
        </button>

        <div className="flex-1"></div>

        {/* Action Buttons */}
        <button 
          onClick={importMedications}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import CSV
        </button>
        
        <button 
          onClick={() => exportMedications()}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
          <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export
        </button>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium"
        >
          Add Medication
        </button>
      </div>

      {/* Bulk Actions Bar (show when items selected) */}
      {selectedMedications.size > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700 font-medium">
            {selectedMedications.size} selected
          </span>
          <button className="text-sm text-gray-600 hover:text-gray-900">Update Stock</button>
          <button className="text-sm text-gray-600 hover:text-gray-900">Change Category</button>
          <button onClick={() => exportMedications()} className="text-sm text-gray-600 hover:text-gray-900">Export</button>
          <button className="text-sm text-red-600 hover:text-red-700">Deactivate</button>
          <div className="flex-1"></div>
          <button 
            onClick={() => setSelectedMedications(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Compact Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedMedications.size === filteredMedications.length && filteredMedications.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosages
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plans
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedications.map((med) => (
                <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedMedications.has(med.id)}
                      onChange={() => toggleMedicationSelection(med.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{med.sku}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleManagePlans(med)}
                      className="text-left hover:text-blue-600"
                    >
                      <div className="text-sm font-medium text-gray-900">{med.name}</div>
                      <div className="text-xs text-gray-500">{med.genericName}</div>
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-gray-900">
                      {med.dosages.slice(0, 2).join(', ')}
                      {med.dosages.length > 2 && (
                        <span className="text-gray-500"> +{med.dosages.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{med.plans.length} plans</div>
                    <div className="text-xs text-gray-500">
                      {med.shippingOptions.length} ship options
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${Math.min(...med.plans.map(p => p.price))}-${Math.max(...med.plans.map(p => p.price))}
                    </div>
                    <div className="text-xs text-gray-500">Cost: ${med.cost}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      med.stock === 0 ? 'text-red-600' :
                      med.stock < 100 ? 'text-orange-600' : 
                      'text-gray-900'
                    }`}>
                      {med.stock.toLocaleString()}
                    </div>
                    {med.stock === 0 && (
                      <div className="text-xs text-red-600">Out of stock</div>
                    )}
                    {med.stock > 0 && med.stock < 100 && (
                      <div className="text-xs text-orange-600">Low stock</div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      med.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {med.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => handleManagePlans(med)}
                      className="text-gray-600 hover:text-gray-900 mr-2"
                    >
                      Plans
                    </button>
                    <button 
                      onClick={() => router.push(`/portal/medication/${med.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setMedToDelete(med)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {filteredMedications.length} of {medications.length} medications
            </span>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Previous</button>
              <span className="px-2 py-1 text-sm text-gray-700">Page 1 of 1</span>
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Manage Plans Modal - keeping this as is since it's a modal */}
      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Medication</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
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
                  
                  const newMedication: Medication = {
                    id: `med-${Date.now()}`,
                    sku: formData.get('sku') as string,
                    name: formData.get('name') as string,
                    genericName: formData.get('genericName') as string,
                    category: formData.get('category') as FilterType,
                    dosages: (formData.get('dosages') as string).split(',').map(d => d.trim()),
                    basePrice: parseFloat(formData.get('basePrice') as string),
                    cost: parseFloat(formData.get('cost') as string),
                    stock: parseInt(formData.get('stock') as string),
                    status: 'active',
                    plans: [],
                    shippingOptions: [{ frequency: 'monthly', default: true }]
                  };
                  
                  setMedications(prev => [...prev, newMedication]);
                  setShowAddModal(false);
                }}>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                        <input
                          type="text"
                          name="sku"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          placeholder="e.g., TRE-025-CR"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          name="category"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="acne">Acne</option>
                          <option value="hairLoss">Hair Loss</option>
                          <option value="ed">ED</option>
                          <option value="weightLoss">Weight Loss</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g., Tretinoin Cream"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
                      <input
                        type="text"
                        name="genericName"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g., Tretinoin"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosages (comma-separated)</label>
                      <input
                        type="text"
                        name="dosages"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="e.g., 0.025%, 0.05%, 0.1%"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                        <input
                          type="number"
                          name="basePrice"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                        <input
                          type="number"
                          name="cost"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                        <input
                          type="number"
                          name="stock"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                      Add Medication
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <div key={plan.id} className="p-4 border border-gray-200 rounded-lg">
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
                          <button 
                            onClick={() => handleEditPlan(plan)}
                            className="text-sm text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleRemovePlan(plan.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
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
                  {selectedMedication.shippingOptions.map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="defaultShipping"
                          checked={option.default}
                          onChange={() => handleSetDefaultShipping(index)}
                          className="mr-3"
                        />
                        <span className="text-sm">{option.frequency}</span>
                        {option.default && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleRemoveShippingOption(index)}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowAddShippingModal(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400"
                  >
                    + Add Shipping Option
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
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".csv"
        style={{ display: 'none' }}
      />

      {/* Add Shipping Option Modal */}
      {showAddShippingModal && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Shipping Option</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Frequency
                </label>
                <input
                  type="text"
                  value={newShippingFrequency}
                  onChange={(e) => setNewShippingFrequency(e.target.value)}
                  placeholder="e.g., 45 days, 2 months"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddShippingModal(false);
                  setNewShippingFrequency('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddShippingOption}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Add Option
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && selectedMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Plan</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              
              const updatedPlan: Plan = {
                ...editingPlan,
                name: formData.get('name') as string,
                price: parseFloat(formData.get('price') as string),
                frequency: formData.get('frequency') as string,
                discount: parseFloat(formData.get('discount') as string) || 0,
                description: formData.get('description') as string
              };
              
              handleUpdatePlan(updatedPlan);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingPlan.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      defaultValue={editingPlan.price}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      name="discount"
                      step="1"
                      min="0"
                      max="100"
                      defaultValue={editingPlan.discount}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    name="frequency"
                    defaultValue={editingPlan.frequency}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="once">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="biannual">Every 6 months</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingPlan.description}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passive Notification */}
      <NotificationPopup message={toast} onClose={() => setToast(null)} />

      {/* Confirm delete medication */}
      <ConfirmDialog
        open={medToDelete !== null}
        title="Delete medication?"
        description={`Remove ${medToDelete?.name} from the database. This action cannot be undone.`}
        confirmText="Delete"
        tone="danger"
        onCancel={() => setMedToDelete(null)}
        onConfirm={() => {
          if (medToDelete) {
            setMedications(prev => prev.filter(m => m.id !== medToDelete.id));
            setToast({ type: 'success', text: 'Medication deleted.' });
          }
          setMedToDelete(null);
        }}
      />
    </div>
  );
}
