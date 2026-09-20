import React, { useState } from 'react';
import { 
  Compass, 
  Search, 
  Plus, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  Languages, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles, 
  Ticket, 
  Clock, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { TourService, TourStyle, Supplier } from '../types';
import { formatCurrency } from '../utils/currency';

interface ToursViewProps {
  tours: TourService[];
  suppliers?: Supplier[];
  onAddTour: (data: Partial<TourService>) => void;
  onUpdateTour: (id: string, data: Partial<TourService>) => void;
  onDeleteTour: (id: string) => void;
  onCreateVoucherForService?: (category: 'Tour', service: TourService) => void;
}

const COMMON_DESTINATIONS = [
  'Cairo & Giza Pyramids',
  'Cairo & Alexandria Highlights',
  'Cairo, Luxor & Aswan Classic',
  'Hurghada Red Sea & Desert Safari',
  'Sharm El Sheikh & Mount Sinai',
  'Siwa Oasis & Great Sand Sea',
  'White & Black Desert Expedition',
  'Fayoum Oasis & Wadi El Hitan'
];

const TOUR_STYLES: TourStyle[] = [
  'Private VIP Tour',
  'Small Group Tour',
  'Cultural & Historical',
  'Adventure & Safari',
  'Luxury Tailor-Made',
  'Religious & Pilgrimage'
];

const PRESET_INCLUSIONS = [
  'Licensed Professional Egyptologist Guide',
  'All Monument Entrance Fees & Site Tickets',
  'Air-Conditioned Private Transport',
  'Authentic Local Lunch at Traditional Restaurant',
  'Hotel / Airport Pickup & Dropoff',
  'Mineral Water & Refreshments on Bus'
];

export function ToursView({
  tours = [],
  suppliers = [],
  onAddTour,
  onUpdateTour,
  onDeleteTour,
  onCreateVoucherForService
}: ToursViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTour, setEditingTour] = useState<TourService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TourService>>({
    tour_title: 'Pyramids of Giza, Sphinx, Sakkara & Memphis Full-Day VIP Tour',
    tour_style: 'Private VIP Tour',
    destination: 'Cairo & Giza Pyramids',
    duration_days: 1,
    guide_languages: ['English', 'Arabic', 'Spanish'],
    min_travelers: 1,
    max_travelers: 15,
    cost_price: 65,
    selling_price: 110,
    currency: 'USD',
    status: 'Active',
    inclusions: [
      'Licensed Professional Egyptologist Guide',
      'All Monument Entrance Fees & Site Tickets',
      'Air-Conditioned Private Transport',
      'Authentic Local Lunch at Traditional Restaurant'
    ],
    exclusions: ['Gratuities / Tipping for Guide & Driver', 'Personal Shopping'],
    highlights: ['Great Pyramid of Khufu', 'The Great Sphinx', 'Step Pyramid of Djoser in Sakkara', 'Ancient Capital of Memphis'],
    itinerary_summary: 'Morning pickup at 8:00 AM from hotel, explore Giza Plateau, lunch overlooking pyramids, afternoon tour of Sakkara step pyramid and Memphis open air museum.'
  });

  const [newHighlightInput, setNewHighlightInput] = useState('');

  const filteredTours = tours.filter(t => {
    const matchesSearch = 
      t.tour_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tour_style?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStyle = styleFilter === 'All' || t.tour_style === styleFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStyle && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingTour(null);
    setFormData({
      tour_title: 'Alexandria Pearl of the Mediterranean Day Tour from Cairo',
      tour_style: 'Small Group Tour',
      destination: 'Cairo & Alexandria Highlights',
      duration_days: 1,
      guide_languages: ['English', 'German'],
      min_travelers: 2,
      max_travelers: 20,
      cost_price: 55,
      selling_price: 95,
      currency: 'USD',
      status: 'Active',
      inclusions: [
        'Licensed Professional Egyptologist Guide',
        'All Monument Entrance Fees & Site Tickets',
        'Air-Conditioned Private Transport',
        'Fresh Seafood Lunch on the Mediterranean Sea'
      ],
      highlights: ['Catacombs of Kom El Shoqafa', 'Pompey Pillar', 'Qaitbay Citadel', 'Bibliotheca Alexandrina']
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: TourService) => {
    setEditingTour(t);
    setFormData({ ...t });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(formData.cost_price) || 0;
    const selling = Number(formData.selling_price) || 0;

    const payload = {
      ...formData,
      cost_price: cost,
      selling_price: selling,
      duration_days: Number(formData.duration_days) || 1,
      min_travelers: Number(formData.min_travelers) || 1,
      max_travelers: Number(formData.max_travelers) || 20
    };

    if (editingTour) {
      onUpdateTour(editingTour.id, payload);
    } else {
      onAddTour(payload);
    }
    setShowAddModal(false);
  };

  const toggleInclusion = (item: string) => {
    const current = formData.inclusions || [];
    if (current.includes(item)) {
      setFormData({
        ...formData,
        inclusions: current.filter(i => i !== item)
      });
    } else {
      setFormData({
        ...formData,
        inclusions: [...current, item]
      });
    }
  };

  const addHighlight = () => {
    if (!newHighlightInput.trim()) return;
    const current = formData.highlights || [];
    if (!current.includes(newHighlightInput.trim())) {
      setFormData({
        ...formData,
        highlights: [...current, newHighlightInput.trim()]
      });
    }
    setNewHighlightInput('');
  };

  const removeHighlight = (idx: number) => {
    const current = formData.highlights || [];
    setFormData({
      ...formData,
      highlights: current.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Guided Tours & Programs</h1>
            <p className="text-sm text-slate-500">Register and manage multi-day tours, historical itineraries, Egyptologist guides, and generate vouchers.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Tour Program</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Programs</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{tours.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Active sightseeing programs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Private VIP Tours</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {tours.filter(t => t.tour_style === 'Private VIP Tour').length}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">Custom tailored private programs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Multilingual Guides</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {new Set(tours.flatMap(t => t.guide_languages || [])).size} Languages
          </div>
          <span className="text-xs text-slate-500 mt-1 block">English, French, German, Spanish, etc.</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Profit / Traveler</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {tours.length > 0 
              ? `$${Math.round(tours.reduce((acc, t) => acc + (t.selling_price - t.cost_price), 0) / tours.length)}` 
              : '$0'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Agency net return</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tour title, destination, or highlights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Style:</span>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Tour Styles</option>
              {TOUR_STYLES.map((st, i) => (
                <option key={i} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Tour Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTours.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Tours Found</h3>
            <p className="text-xs text-slate-500 mt-1">Register new tour programs to make them available for vouchers.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Tour</span>
            </button>
          </div>
        ) : (
          filteredTours.map((t) => {
            const profit = (t.selling_price || 0) - (t.cost_price || 0);
            return (
              <div 
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {t.destination}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {/* Title & Style */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{t.tour_title}</h3>
                    <p className="text-xs font-semibold text-emerald-800 mt-0.5">{t.tour_style}</p>
                  </div>

                  {/* Program Duration & Languages */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-bold text-slate-800">{t.duration_days} Day(s)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Guide Languages:</span>
                      <span className="font-medium text-slate-800">{t.guide_languages?.join(', ') || 'English'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Group Size:</span>
                      <span className="font-medium text-slate-800">{t.min_travelers} - {t.max_travelers} Travelers</span>
                    </div>
                  </div>

                  {/* Highlights */}
                  {t.highlights && t.highlights.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Top Highlights:</span>
                      <div className="flex flex-wrap gap-1">
                        {t.highlights.slice(0, 3).map((hl, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            ★ {hl}
                          </span>
                        ))}
                        {t.highlights.length > 3 && (
                          <span className="text-[10px] font-bold text-emerald-600 px-1 py-0.5">
                            +{t.highlights.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Matrix */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Cost / Pax</span>
                      <span className="text-xs font-bold text-slate-700">{formatCurrency(t.cost_price, t.currency)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Selling Rate</span>
                      <span className="text-xs font-extrabold text-emerald-700">{formatCurrency(t.selling_price, t.currency)}</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Profit</span>
                      <span className="text-xs font-extrabold text-emerald-800">+{formatCurrency(profit, t.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Tour"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(t.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Tour"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateVoucherForService?.('Tour', t)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Issue Voucher</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTour ? 'Edit Tour Program' : 'Register New Tour Program'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tour Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.tour_title || ''}
                    onChange={(e) => setFormData({ ...formData, tour_title: e.target.value })}
                    placeholder="e.g. Classical Egypt Giza & Egyptian Museum Tour"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tour Style</label>
                  <select
                    value={formData.tour_style}
                    onChange={(e) => setFormData({ ...formData, tour_style: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    {TOUR_STYLES.map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Region</label>
                  <input
                    type="text"
                    list="tour-destinations"
                    required
                    value={formData.destination || ''}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Cairo, Luxor, Hurghada"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                  <datalist id="tour-destinations">
                    {COMMON_DESTINATIONS.map((d, i) => (
                      <option key={i} value={d} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={formData.duration_days || 1}
                    onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Group Capacity</label>
                  <input
                    type="number"
                    value={formData.max_travelers || 20}
                    onChange={(e) => setFormData({ ...formData, max_travelers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Financial Pricing</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Net Cost / Traveler</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-700 mb-1">Selling Price / Traveler *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.selling_price || 0}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-1.5 text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
                    <select
                      value={formData.currency || 'USD'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EGP">EGP</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Highlights Builder */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Tour Highlights</label>
                <div className="flex flex-wrap gap-1.5">
                  {formData.highlights?.map((hl, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg font-medium">
                      <span>{hl}</span>
                      <button type="button" onClick={() => removeHighlight(i)} className="text-emerald-500 hover:text-rose-600">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add landmark or key highlight..."
                    value={newHighlightInput}
                    onChange={(e) => setNewHighlightInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(); } }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Inclusions checklist */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Included Services</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {PRESET_INCLUSIONS.map((inc, i) => {
                    const isChecked = formData.inclusions?.includes(inc);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleInclusion(inc)}
                        className={`text-left text-xs p-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate mr-2">{inc}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Itinerary Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Itinerary / Program Summary</label>
                <textarea
                  rows={2}
                  value={formData.itinerary_summary || ''}
                  onChange={(e) => setFormData({ ...formData, itinerary_summary: e.target.value })}
                  placeholder="e.g. Day 1: Giza Pyramids & Sphinx, Lunch, Afternoon Khan El Khalili Bazaar."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingTour ? 'Save Changes' : 'Register Tour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Delete Tour Program</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Are you sure you want to delete this tour program from the system?</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmId) onDeleteTour(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
