import React, { useState } from 'react';
import { 
  Sun, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  MapPin, 
  Activity, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Ticket, 
  AlertCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { DayTripService, DayTripCategory, Supplier } from '../types';
import { formatCurrency } from '../utils/currency';

interface DayTripsViewProps {
  dayTrips: DayTripService[];
  suppliers?: Supplier[];
  onAddDayTrip: (data: Partial<DayTripService>) => void;
  onUpdateDayTrip: (id: string, data: Partial<DayTripService>) => void;
  onDeleteDayTrip: (id: string) => void;
  onCreateVoucherForService?: (category: 'Day Trip', service: DayTripService) => void;
}

const COMMON_CITIES = [
  'Cairo & Giza',
  'Hurghada / Red Sea',
  'Sharm El Sheikh / Sinai',
  'Luxor',
  'Aswan',
  'Alexandria',
  'Ain Sokhna',
  'Marsa Alam',
  'Dahab',
  'Fayoum'
];

const CATEGORIES: DayTripCategory[] = [
  'Desert Safari & Quad Biking',
  'Boat & Snorkeling / Diving',
  'Hot Air Balloon Sunrise',
  'City Excursion & Shopping',
  'Water Sports & Aqua Park',
  'Historical Monuments',
  'Beach Day Use & Relaxation'
];

const PRESET_INCLUSIONS = [
  'Hotel Roundtrip Air-Conditioned Transportation',
  'All Activity Equipment (Quads / Snorkel Gear / Life Jackets)',
  'Open Buffet Lunch / Bedouin BBQ Dinner',
  'National Park Entrance Fees & Marine Taxes',
  'Professional Tour Leader & Safety Briefing',
  'Soft Drinks & Bottled Mineral Water'
];

export function DayTripsView({
  dayTrips = [],
  suppliers = [],
  onAddDayTrip,
  onUpdateDayTrip,
  onDeleteDayTrip,
  onCreateVoucherForService
}: DayTripsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<DayTripService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<DayTripService>>({
    trip_title: 'Hurghada Giftun Orange Bay Island Snorkeling Boat Excursion',
    category: 'Boat & Snorkeling / Diving',
    city_location: 'Hurghada / Red Sea',
    duration_hours: 7,
    departure_time: '08:30 AM',
    cost_price: 25,
    selling_price: 45,
    currency: 'USD',
    status: 'Active',
    inclusions: [
      'Hotel Roundtrip Air-Conditioned Transportation',
      'All Activity Equipment (Quads / Snorkel Gear / Life Jackets)',
      'Open Buffet Lunch / Bedouin BBQ Dinner',
      'National Park Entrance Fees & Marine Taxes'
    ],
    highlights: ['Orange Bay Caribbean-style beach stop (2 hours)', '2 Snorkeling reef stops with vibrant corals', 'Buffet lunch cooked onboard boat', 'Banana boat water sports ride'],
    notes: 'Please bring towels, sunglasses, and swimwear.'
  });

  const filteredTrips = dayTrips.filter(t => {
    const matchesSearch = 
      t.trip_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.city_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesCity = cityFilter === 'All' || t.city_location === cityFilter;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const handleOpenAdd = () => {
    setEditingTrip(null);
    setFormData({
      trip_title: 'Luxor Hot Air Balloon Sunrise Adventure',
      category: 'Hot Air Balloon Sunrise',
      city_location: 'Luxor',
      duration_hours: 3,
      departure_time: '04:30 AM',
      cost_price: 45,
      selling_price: 80,
      currency: 'USD',
      status: 'Active',
      inclusions: [
        'Hotel Pickup & Motorboat Nile Crossing',
        '45-Minute Hot Air Balloon Flight over Valley of Kings',
        'Flight Certificate & Refreshments'
      ],
      highlights: ['Sunrise aerial view of Hatshepsut Temple and Colossi of Memnon', 'Nile river panoramic morning photos']
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: DayTripService) => {
    setEditingTrip(t);
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
      duration_hours: Number(formData.duration_hours) || 4
    };

    if (editingTrip) {
      onUpdateTrip(editingTrip.id, payload);
    } else {
      onAddDayTrip(payload);
    }
    setShowAddModal(false);
  };

  const onUpdateTrip = onUpdateDayTrip;

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

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Day Trips & Daily Excursions</h1>
            <p className="text-sm text-slate-500">Register daily safaris, snorkeling boats, hot air balloons, beach days, and issue customer vouchers.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Day Trip</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalog Activities</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{dayTrips.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Active excursion packages</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Marine & Diving</span>
          <div className="text-2xl font-bold text-sky-600 mt-1">
            {dayTrips.filter(t => t.category === 'Boat & Snorkeling / Diving').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Red Sea boat excursions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desert Safaris</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {dayTrips.filter(t => t.category === 'Desert Safari & Quad Biking').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Quads, buggies & Bedouin nights</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Markup / Pax</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {dayTrips.length > 0 
              ? `$${Math.round(dayTrips.reduce((acc, t) => acc + (t.selling_price - t.cost_price), 0) / dayTrips.length)}` 
              : '$0'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Direct margin per ticket</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by excursion title, location, or activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">City:</span>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Cities</option>
              {COMMON_CITIES.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Day Trip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Sun className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Day Trips Found</h3>
            <p className="text-xs text-slate-500 mt-1">Register daily safaris, boat trips, or adventure excursions.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Day Trip</span>
            </button>
          </div>
        ) : (
          filteredTrips.map((t) => {
            const profit = (t.selling_price || 0) - (t.cost_price || 0);
            return (
              <div 
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      {t.category}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{t.trip_title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      {t.city_location}
                    </p>
                  </div>

                  {/* Timing details */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-bold text-slate-800">{t.duration_hours} Hours</span>
                    </div>
                    {t.departure_time && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Departure Time:</span>
                        <span className="font-medium text-slate-800">{t.departure_time}</span>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  {t.highlights && t.highlights.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Excursion Program:</span>
                      <div className="space-y-1">
                        {t.highlights.slice(0, 2).map((hl, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{hl}</span>
                          </div>
                        ))}
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
                      <span className="text-xs font-extrabold text-amber-800">{formatCurrency(t.selling_price, t.currency)}</span>
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
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Day Trip"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(t.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Day Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateVoucherForService?.('Day Trip', t)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Sun className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTrip ? 'Edit Day Trip Excursion' : 'Register New Day Trip'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Excursion Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.trip_title || ''}
                    onChange={(e) => setFormData({ ...formData, trip_title: e.target.value })}
                    placeholder="e.g. Hurghada Desert Quad Safari with Bedouin Dinner"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Activity Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    {CATEGORIES.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                  <select
                    value={formData.city_location}
                    onChange={(e) => setFormData({ ...formData, city_location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    {COMMON_CITIES.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    value={formData.duration_hours || 4}
                    onChange={(e) => setFormData({ ...formData, duration_hours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Departure Time</label>
                  <input
                    type="text"
                    value={formData.departure_time || ''}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                    placeholder="e.g. 08:30 AM or 03:00 PM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Financial Pricing</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Net Cost / Pax</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">Selling Rate / Pax *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.selling_price || 0}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-1.5 text-sm font-bold"
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

              {/* Inclusions checklist */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Included Amenities</label>
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
                            ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate mr-2">{inc}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
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
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingTrip ? 'Save Changes' : 'Register Day Trip'}
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
            <h3 className="text-base font-bold text-slate-900">Delete Day Trip Excursion</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Are you sure you want to delete this day trip from the system?</p>
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
                  if (deleteConfirmId) onDeleteDayTrip(deleteConfirmId);
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
