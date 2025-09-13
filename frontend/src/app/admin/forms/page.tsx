'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function AdminFormsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewForm, setPreviewForm] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formsPerPage] = useState(6);
  const [currentFormPage, setCurrentFormPage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const availableServices = [
    'Acne Treatment',
    'Hair Loss Treatment',
    'Erectile Dysfunction',
    'Medical Weight Loss',
    'UTI Treatment',
    'Birth Control',
  ];

  const availablePlans = [
    { id: 'basic', name: 'Basic Plan', price: 29 },
    { id: 'standard', name: 'Standard Plan', price: 59 },
    { id: 'premium', name: 'Premium Plan', price: 99 },
  ];
  
  const defaultForms = [
    {
      id: 1,
      name: 'Acne Consultation Form',
      service: 'Acne Treatment',
      category: 'dermatology',
      status: 'active',
      submissions: 234,
      lastUpdated: '2024-12-05',
      associatedPlans: ['basic', 'standard'],
      pages: [
        {
          title: 'Medical History',
          fields: [
            { id: 'f1', type: 'text', label: 'When did your acne first appear?', required: true },
            { id: 'f2', type: 'select', label: 'Acne severity', options: ['Mild', 'Moderate', 'Severe'], required: true },
          ]
        },
        {
          title: 'Treatment History',
          fields: [
            { id: 'f4', type: 'textarea', label: 'Previous treatments tried', required: false },
          ]
        }
      ],
    },
    {
      id: 2,
      name: 'Hair Loss Assessment',
      service: 'Hair Loss Treatment',
      category: 'dermatology',
      status: 'active',
      submissions: 156,
      lastUpdated: '2024-12-01',
      associatedPlans: ['standard', 'premium'],
      pages: [
        {
          title: 'Hair Loss Details',
          fields: [
            { id: 'f7', type: 'text', label: 'When did you first notice hair loss?', required: true },
            { id: 'f8', type: 'select', label: 'Pattern of hair loss', options: ['Crown', 'Temples', 'Overall thinning'], required: true },
          ]
        }
      ],
    },
  ];

  const [forms, setForms] = useState(defaultForms);
  const [newField, setNewField] = useState({
    type: 'text',
    label: '',
    required: true,
    options: [''],
  });

  useEffect(() => {
    const savedForms = localStorage.getItem('adminForms');
    if (savedForms) {
      try {
        setForms(JSON.parse(savedForms));
      } catch (e) {
        console.error('Error loading saved forms:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adminForms', JSON.stringify(forms));
  }, [forms]);

  const filteredForms = activeTab === 'all' 
    ? forms 
    : activeTab === 'active' 
    ? forms.filter(f => f.status === 'active')
    : activeTab === 'draft'
    ? forms.filter(f => f.status === 'draft')
    : forms.filter(f => f.category === activeTab);

  const indexOfLastForm = currentPage * formsPerPage;
  const indexOfFirstForm = indexOfLastForm - formsPerPage;
  const currentForms = filteredForms.slice(indexOfFirstForm, indexOfLastForm);
  const totalPages = Math.ceil(filteredForms.length / formsPerPage);

  const handleCreateForm = () => {
    setEditingForm({
      name: '',
      service: '',
      category: '',
      associatedPlans: [],
      pages: [{ title: 'Page 1', fields: [] }],
    });
    setCurrentFormPage(0);
    setShowFormBuilder(true);
  };

  const handleEditForm = (form: any) => {
    if (!form.pages) {
      form.pages = [{
        title: 'Page 1',
        fields: []
      }];
    }
    setEditingForm(form);
    setCurrentFormPage(0);
    setShowFormBuilder(true);
  };

  const handleAddField = () => {
    if (!newField.label) return;
    
    const field = {
      id: `f${Date.now()}`,
      type: newField.type,
      label: newField.label,
      required: newField.required,
      ...((['select', 'radio', 'checkbox'].includes(newField.type)) && {
        options: newField.options.filter(o => o.trim())
      }),
    };

    const updatedPages = [...editingForm.pages];
    updatedPages[currentFormPage].fields.push(field);

    setEditingForm({
      ...editingForm,
      pages: updatedPages,
    });

    setNewField({
      type: 'text',
      label: '',
      required: true,
      options: [''],
    });
  };

  const handleExportForm = (form: any) => {
    const dataStr = JSON.stringify(form, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${form.name.replace(/\s+/g, '_')}_form.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportForm = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedForm = JSON.parse(e.target?.result as string);
        importedForm.id = Date.now();
        importedForm.lastUpdated = new Date().toISOString().split('T')[0];
        importedForm.submissions = 0;
        importedForm.status = 'draft';
        
        setForms([...forms, importedForm]);
        alert('Form imported successfully!');
      } catch (error) {
        alert('Error importing form. Please check the JSON format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveForm = () => {
    if (!editingForm.name || !editingForm.service) {
      alert('Please fill in form name and service');
      return;
    }
    
    if (editingForm.id) {
      setForms(forms.map(f => f.id === editingForm.id ? editingForm : f));
    } else {
      const newForm = {
        ...editingForm,
        id: Date.now(),
        status: editingForm.status || 'draft',
        submissions: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      setForms([...forms, newForm]);
    }
    
    setShowFormBuilder(false);
    setEditingForm(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportForm}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Forms</h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage consultation forms for each service</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Import JSON
              </button>
              <button
                onClick={handleCreateForm}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create New Form
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentForms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                    <p className="text-sm text-gray-500">{form.service}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    form.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pages:</span>
                    <span className="font-medium">{form.pages?.length || 1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Fields:</span>
                    <span className="font-medium">
                      {form.pages ? form.pages.reduce((sum: number, page: any) => sum + page.fields.length, 0) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plans:</span>
                    <span className="text-xs">
                      {form.associatedPlans?.map((planId: string) => 
                        availablePlans.find(p => p.id === planId)?.name || planId
                      ).join(', ') || 'None'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between">
                  <button
                    onClick={() => handleEditForm(form)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Edit
                  </button>
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setPreviewForm(form);
                      setShowPreview(true);
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleExportForm(form)}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 rounded ${
                    currentPage === index + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </main>

      {/* Form Builder Modal */}
      {showFormBuilder && editingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingForm.id ? 'Edit Form' : 'Create New Form'}
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Form Name</label>
                  <input
                    type="text"
                    value={editingForm.name || ''}
                    onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Acne Consultation Form"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={editingForm.service || ''}
                    onChange={(e) => setEditingForm({ ...editingForm, service: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select service</option>
                    {availableServices.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Associated Plans */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated Plans</label>
                <div className="flex flex-wrap gap-2">
                  {availablePlans.map(plan => (
                    <label key={plan.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingForm.associatedPlans?.includes(plan.id) || false}
                        onChange={(e) => {
                          const plans = editingForm.associatedPlans || [];
                          if (e.target.checked) {
                            setEditingForm({ ...editingForm, associatedPlans: [...plans, plan.id] });
                          } else {
                            setEditingForm({ ...editingForm, associatedPlans: plans.filter((p: string) => p !== plan.id) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{plan.name} (${plan.price})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Pages */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Form Pages</h4>
                <div className="border-b mb-4">
                  <nav className="-mb-px flex space-x-4">
                    {editingForm.pages?.map((page: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFormPage(index)}
                        className={`py-2 px-3 border-b-2 font-medium text-sm ${
                          currentFormPage === index
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {page.title || `Page ${index + 1}`}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setEditingForm({
                          ...editingForm,
                          pages: [...editingForm.pages, { title: `Page ${editingForm.pages.length + 1}`, fields: [] }]
                        });
                      }}
                      className="py-2 px-3 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      + Add Page
                    </button>
                  </nav>
                </div>

                {/* Add New Field */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="font-medium text-sm mb-3">Add Field to Current Page</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="text">Text Input</option>
                        <option value="textarea">Text Area</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown</option>
                        <option value="radio">Radio Buttons</option>
                        <option value="checkbox">Checkboxes</option>
                        <option value="date">Date Picker</option>
                        <option value="file">File Upload</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone Number</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
                      <input
                        type="text"
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Enter field label"
                      />
                    </div>
                  </div>
                  
                  {['select', 'radio', 'checkbox'].includes(newField.type) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                      {newField.options.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const updatedOptions = [...newField.options];
                            updatedOptions[index] = e.target.value;
                            setNewField({ ...newField, options: updatedOptions });
                          }}
                          className="w-full px-3 py-2 border rounded-lg mb-2"
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                      <button
                        onClick={() => setNewField({ ...newField, options: [...newField.options, ''] })}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newField.required}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Required field</span>
                    </label>
                  </div>
                  
                  <button
                    onClick={handleAddField}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Field
                  </button>
                </div>

                {/* Current Page Fields */}
                {editingForm.pages && editingForm.pages[currentFormPage] && (
                  <div className="mt-4">
                    <h5 className="font-medium text-sm mb-3">Current Fields</h5>
                    {editingForm.pages[currentFormPage].fields.length > 0 ? (
                      <div className="space-y-2">
                        {editingForm.pages[currentFormPage].fields.map((field: any, index: number) => (
                          <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{index + 1}. {field.label}</span>
                              <div className="text-xs text-gray-500 mt-1">
                                Type: {field.type} | Required: {field.required ? 'Yes' : 'No'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No fields added to this page yet.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setPreviewForm(editingForm);
                    setShowPreview(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Preview Form
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowFormBuilder(false);
                      setEditingForm(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveForm}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Preview Modal */}
      {showPreview && previewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">{previewForm.name}</h3>
              <p className="text-gray-600 mt-1">{previewForm.service}</p>
            </div>
            
            {previewForm.pages && previewForm.pages.map((page: any, pageIndex: number) => (
              <div key={pageIndex} className="mb-8">
                <h4 className="text-lg font-semibold mb-4">Page {pageIndex + 1}: {page.title}</h4>
                <form className="space-y-6">
                  {page.fields.map((field: any, index: number) => (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {index + 1}. {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Enter your answer..."
                          required={field.required}
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          rows={4}
                          placeholder="Enter your answer..."
                          required={field.required}
                        />
                      )}
                      
                      {field.type === 'select' && field.options && (
                        <select
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required={field.required}
                        >
                          <option value="">Select an option...</option>
                          {field.options.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'radio' && field.options && (
                        <div className="space-y-2">
                          {field.options.map((option: string) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="radio"
                                name={field.id}
                                value={option}
                                required={field.required}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'checkbox' && field.options && (
                        <div className="space-y-2">
                          {field.options.map((option: string) => (
                            <label key={option} className="flex items-center">
                              <input
                                type="checkbox"
                                name={`${field.id}[]`}
                                value={option}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </form>
              </div>
            ))}
            
            <div className="flex justify-end mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewForm(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
