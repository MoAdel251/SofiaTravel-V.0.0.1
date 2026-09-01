import React, { useState, useRef } from 'react';
import { Compass, Plus, Users, Calendar, DollarSign, CheckCircle2, ArrowRight, X, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { TourPackage } from '../types';

interface TourPackagesViewProps {
  packages: TourPackage[];
  onAddPackage: (data: Partial<TourPackage>) => void;
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

export function TourPackagesView({ packages, onAddPackage, onBookPackage }: TourPackagesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setFormData(prev => ({
            ...prev,
            images: [base64Url]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyCustomImageUrl = () => {
    if (customImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [customImageUrl.trim()]
      }));
      setCustomImageUrl('');
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

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tour Packages Management</h1>
          <p className="text-sm text-slate-500">Curated travel itineraries, pricing, currency setting, seat allocations, and bookings.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Tour Package</span>
        </button>
      </div>

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
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-xs text-slate-900 shadow-sm">
                  {pkg.status}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">{pkg.destination}</span>
                  <span className="text-xs text-slate-500 font-medium">{pkg.duration}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{pkg.package_name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{pkg.activities}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Available Seats: <strong className="text-slate-900">{pkg.available_seats}</strong></span>
                  <span className="text-lg font-extrabold text-cyan-600">
                    {pkg.currency === 'EGP' ? 'EGP ' : pkg.currency === 'EUR' ? '€' : '$'}{pkg.selling_price} ({pkg.currency || 'USD'})
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => onBookPackage(pkg)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>Book Package (Go to Reservation)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Tour Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add New Tour Package</h3>
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
                  {/* Current Preview */}
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
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs font-semibold">
                      Preview
                    </span>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 w-full space-y-2.5">
                    {/* Hidden input for local file */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Computer</span>
                      </button>
                    </div>

                    {/* Or URL input */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Or paste image URL (https://...)"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomImageUrl}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preset Gallery */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick Select Curated Destination Photos:</span>
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_PACKAGE_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, images: [preset.url] }))}
                        className={`group relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          formData.images?.[0] === preset.url ? 'border-cyan-600 ring-2 ring-cyan-400' : 'border-slate-200 hover:border-slate-400'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <span className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] font-semibold px-1 truncate text-center">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package General Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    placeholder="e.g. Wonders of Cairo & Nile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Cairo, Luxor, Aswan"
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
                    placeholder="e.g. 7 Days / 6 Nights"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold"
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
    </div>
  );
}
