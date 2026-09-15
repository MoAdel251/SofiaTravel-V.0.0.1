import React, { useState, useRef } from 'react';
import { 
  Compass, 
  Plus, 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Sparkles,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { TourPackage } from '../types';

interface TourPackagesViewProps {
  packages: TourPackage[];
  onAddPackage: (data: Partial<TourPackage>) => void;
  onUpdatePackage?: (id: string, data: Partial<TourPackage>) => void;
  onDeletePackage?: (id: string) => void;
  onBookPackage: (pkg: TourPackage) => void;
}

const PRESET_PACKAGE_IMAGES = [
  { label: 'Giza Pyramids & Sphinx', url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800' },
  { label: 'Nile Cruise & Luxor Temple', url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=800' },
  { label: 'Red Sea & Coral Reefs', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800' },
  { label: 'Alexandria Mediterranean Coast', url: 'https://images.unsplash.com/photo-1568322445778-2946c6524dc3?auto=format&fit=crop&q=80&w=800' },
  { label: 'Sahara & White Desert Safari', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800' },
  { label: 'Dubai Skyline & Marina', url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800' },
];

export function TourPackagesView({ 
  packages = [], 
  onAddPackage, 
  onUpdatePackage, 
  onDeletePackage, 
  onBookPackage 
}: TourPackagesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TourPackage | null>(null);
  const [deleteConfirmPkg, setDeleteConfirmPkg] = useState<TourPackage | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [formData, setFormData] = useState<Partial<TourPackage>>({
    package_name: '',
    destination: '',
    duration: '5 Days / 4 Nights',
    start_date: '2026-09-15',
    end_date: '2026-09-20',
    hotel: 'Marriott Mena House',
    transportation: 'Private Luxury Van',
    activities: 'Guided Tours, Museum Passes & Excursions',
    meals: 'Full Board',
    available_seats: 10,
    cost: 500,
    selling_price: 850,
    currency: 'USD',
    profit_margin: 40,
    included_services: ['Hotel Accommodation', 'Expert Tour Guide', 'Entry Tickets', 'Airport Transfers'],
    excluded_services: ['International Flights', 'Personal Expenses'],
    terms_conditions: 'Standard terms apply. 50% deposit required upon confirmation.',
    images: ['https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800'],
    status: 'Available'
  });

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          if (isEdit && editingPackage) {
            setEditingPackage(prev => prev ? ({ ...prev, images: [base64Url] }) : null);
          } else {
            setFormData(prev => ({
              ...prev,
              images: [base64Url]
            }));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPackage(formData);
    setShowAddModal(false);
    setFormData({
      package_name: '',
      destination: '',
      duration: '5 Days / 4 Nights',
      start_date: '2026-09-15',
      end_date: '2026-09-20',
      hotel: 'Marriott Mena House',
      transportation: 'Private Luxury Van',
      activities: 'Guided Tours, Museum Passes & Excursions',
      meals: 'Full Board',
      available_seats: 10,
      cost: 500,
      selling_price: 850,
      currency: 'USD',
      profit_margin: 40,
      included_services: ['Hotel Accommodation', 'Expert Tour Guide', 'Entry Tickets'],
      excluded_services: ['Flights'],
      terms_conditions: 'Standard terms apply.',
      images: ['https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800'],
      status: 'Available'
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPackage && onUpdatePackage) {
      onUpdatePackage(editingPackage.id, editingPackage);
      setEditingPackage(null);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmPkg && onDeletePackage) {
      onDeletePackage(deleteConfirmPkg.id);
      setDeleteConfirmPkg(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-600 rounded-xl text-white shadow-md shadow-cyan-600/20">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Tour Packages & Trips Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curated travel packages, itineraries, pricing, currency settings, seat allocations, and booking requests.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Tour Package</span>
        </button>
      </div>

      {/* Package List Grid */}
      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Compass className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Tour Packages Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Click the "New Tour Package" button above to add your first curated travel package.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Package</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="h-48 overflow-hidden relative group">
                  <img 
                    src={pkg.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&q=80&w=800'} 
                    alt={pkg.package_name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-xs text-slate-900 shadow-sm">
                      {pkg.status}
                    </span>
                  </div>

                  {/* Top Action Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {onUpdatePackage && (
                      <button
                        onClick={() => setEditingPackage({ ...pkg })}
                        className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-cyan-600 rounded-lg shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
                        title="Edit Trip / Tour Package"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeletePackage && (
                      <button
                        onClick={() => setDeleteConfirmPkg(pkg)}
                        className="p-2 bg-white/90 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg shadow-sm backdrop-blur-xs transition-colors cursor-pointer"
                        title="Delete Trip / Tour Package"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">{pkg.destination}</span>
                    <span className="text-xs text-slate-500 font-medium">{pkg.duration}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{pkg.package_name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{pkg.activities || ''}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Available Seats: <strong className="text-slate-900">{pkg.available_seats}</strong></span>
                    <span className="text-base sm:text-lg font-extrabold text-cyan-600">
                      {pkg.currency === 'EGP' ? 'EGP ' : pkg.currency === 'EUR' ? '€' : '$'}{pkg.selling_price} ({pkg.currency || 'USD'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => onBookPackage(pkg)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <span>Book Package (Go to Reservation)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Hotel: {pkg.hotel || 'Included'}</span>
                  <span>Cost: ${pkg.cost || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Tour Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Add New Tour Package</h3>
                <p className="text-xs text-slate-500">Configure package details, upload an attractive photo, and set pricing.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* IMAGE UPLOAD SECTION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-600" />
                    <span>Package Image (Upload or Select Preset) *</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Enhance visual appeal</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                    {formData.images?.[0] ? (
                      <img 
                        src={formData.images[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">No image selected</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="block w-full">
                      <span className="sr-only">Upload local image</span>
                      <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-cyan-300 rounded-xl bg-cyan-50/50 hover:bg-cyan-50 cursor-pointer text-cyan-700 text-xs font-semibold gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload Image File from Device</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageFileUpload(e, false)} 
                        className="hidden" 
                      />
                    </label>

                    <div className="text-[11px] text-slate-400 text-center font-medium">Or choose a scenic preset:</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_PACKAGE_IMAGES.slice(0, 4).map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, images: [preset.url] }))}
                          className="text-left text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-500 hover:text-cyan-700 truncate font-medium cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="e.g. Classic Cairo & Pyramids Discovery"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Cairo & Alexandria"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 5 Days / 4 Nights"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Seats *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.available_seats}
                    onChange={(e) => setFormData({ ...formData, available_seats: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Currency</label>
                  <select
                    value={formData.currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="USD">U.S. Dollar (USD)</option>
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="AED">UAE Dirham (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold text-cyan-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Partner</label>
                  <input
                    type="text"
                    value={formData.hotel}
                    onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                    placeholder="e.g. Marriott Mena House"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activities & Highlights</label>
                <textarea
                  rows={2}
                  value={formData.activities}
                  onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                  placeholder="e.g. Giza Pyramids, Nile Dinner Cruise, Egyptian Museum VIP tour..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Create Tour Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tour Package Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Tour Package</h3>
                <p className="text-xs text-slate-500">Update package itinerary, pricing, and services. Manager approval may apply.</p>
              </div>
              <button onClick={() => setEditingPackage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              {/* IMAGE UPLOAD SECTION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-600" />
                    <span>Package Image</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Update photo</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                    {editingPackage.images?.[0] ? (
                      <img 
                        src={editingPackage.images[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">No image selected</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="block w-full">
                      <span className="sr-only">Upload local image</span>
                      <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-cyan-300 rounded-xl bg-cyan-50/50 hover:bg-cyan-50 cursor-pointer text-cyan-700 text-xs font-semibold gap-2 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload New Image</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleImageFileUpload(e, true)} 
                        className="hidden" 
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_PACKAGE_IMAGES.slice(0, 4).map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setEditingPackage(prev => prev ? ({ ...prev, images: [preset.url] }) : null)}
                          className="text-left text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-cyan-500 hover:text-cyan-700 truncate font-medium cursor-pointer transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPackage.package_name || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, package_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={editingPackage.destination || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, destination: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration *</label>
                  <input
                    type="text"
                    required
                    value={editingPackage.duration || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, duration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Available Seats *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingPackage.available_seats || 0}
                    onChange={(e) => setEditingPackage({ ...editingPackage, available_seats: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Currency</label>
                  <select
                    value={editingPackage.currency || 'USD'}
                    onChange={(e) => setEditingPackage({ ...editingPackage, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="USD">U.S. Dollar (USD)</option>
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="AED">UAE Dirham (AED)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingPackage.selling_price || 0}
                    onChange={(e) => setEditingPackage({ ...editingPackage, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold text-cyan-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingPackage.cost || 0}
                    onChange={(e) => setEditingPackage({ ...editingPackage, cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Partner</label>
                  <input
                    type="text"
                    value={editingPackage.hotel || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, hotel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingPackage.status || 'Available'}
                    onChange={(e) => setEditingPackage({ ...editingPackage, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Available">Available</option>
                    <option value="Limited">Limited Seats</option>
                    <option value="Sold Out">Sold Out</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activities & Highlights</label>
                <textarea
                  rows={2}
                  value={editingPackage.activities || ''}
                  onChange={(e) => setEditingPackage({ ...editingPackage, activities: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes / Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPkg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Tour Package</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteConfirmPkg.package_name}"</span>?
                <br />(Manager authorization will be requested if not authorized)
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPkg(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
