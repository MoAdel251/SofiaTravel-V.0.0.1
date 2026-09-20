import React, { useState } from 'react';
import { 
  Ship, 
  Search, 
  Plus, 
  Filter, 
  MapPin, 
  Anchor, 
  Calendar, 
  Star, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Utensils, 
  Compass, 
  Ticket, 
  AlertCircle 
} from 'lucide-react';
import { CruiseService, CruiseCabinType, BoardBasis, Supplier } from '../types';
import { formatCurrency } from '../utils/currency';

interface CruisesViewProps {
  cruises: CruiseService[];
  suppliers?: Supplier[];
  onAddCruise: (data: Partial<CruiseService>) => void;
  onUpdateCruise: (id: string, data: Partial<CruiseService>) => void;
  onDeleteCruise: (id: string) => void;
  onCreateVoucherForService?: (category: 'Cruise', service: CruiseService) => void;
}

const COMMON_ITINERARIES = [
  'Luxor to Aswan (4 Nights / 5 Days Nile Cruise)',
  'Aswan to Luxor (3 Nights / 4 Days Nile Cruise)',
  'Roundtrip Luxor (7 Nights / 8 Days Classical Nile)',
  'Lake Nasser Cruise (Abu Simbel - Aswan 4 Nights)',
  'Dahabiya Luxury Private Nile Sail (5 Nights)',
  'Red Sea Liveaboard Diving Cruise (Hurghada - Brothers - Daedalus)',
  'Mediterranean Cruise (Alexandria / Port Said Port of Call)'
];

const PRESET_INCLUSIONS = [
  'Full Board Meals (Breakfast, Lunch, Dinner Buffet / A La Carte)',
  'Sightseeing Shore Excursions with Egyptologist Guide',
  'All Temple & Monument Entrance Tickets',
  'Galabeya Themed Party & Nubian Folk Show',
  'Swimming Pool, Sun Deck & Lounge Access',
  'Afternoon High Tea during Nile Sailing',
  'Luggage Handling & Port Taxes'
];

export function CruisesView({
  cruises = [],
  suppliers = [],
  onAddCruise,
  onUpdateCruise,
  onDeleteCruise,
  onCreateVoucherForService
}: CruisesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCruise, setEditingCruise] = useState<CruiseService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CruiseService>>({
    cruise_name: 'M/S Royal Lotus 5-Star Deluxe Nile Cruise',
    cruise_type: 'Nile Cruise',
    ship_rating: '5-Star Deluxe',
    route_itinerary: 'Luxor to Aswan (4 Nights / 5 Days Nile Cruise)',
    embarkation_port: 'Luxor (East Bank Pier)',
    disembarkation_port: 'Aswan (Corniche Pier)',
    duration_nights: 4,
    cabin_type: 'Deluxe Nile View Cabin (Double)',
    board_basis: 'Full Board (FB)',
    cost_price: 320,
    selling_price: 520,
    currency: 'USD',
    status: 'Active',
    inclusions: [
      'Full Board Meals (Breakfast, Lunch, Dinner Buffet / A La Carte)',
      'Sightseeing Shore Excursions with Egyptologist Guide',
      'All Temple & Monument Entrance Tickets',
      'Galabeya Themed Party & Nubian Folk Show'
    ],
    deck_name: 'Upper Promenade Deck',
    notes: 'Visits Valley of the Kings, Karnak, Edfu, Kom Ombo, and Philae Temple.'
  });

  const filteredCruises = cruises.filter(c => {
    const matchesSearch = 
      c.cruise_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.route_itinerary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.embarkation_port?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStar = starFilter === 'All' || c.ship_rating === starFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStar && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingCruise(null);
    setFormData({
      cruise_name: 'M/S Nile Goddess 5-Star Luxury',
      cruise_type: 'Nile Cruise',
      ship_rating: '5-Star Luxury',
      route_itinerary: 'Aswan to Luxor (3 Nights / 4 Days Nile Cruise)',
      embarkation_port: 'Aswan',
      disembarkation_port: 'Luxor',
      duration_nights: 3,
      cabin_type: 'Deluxe Nile View Cabin (Double)',
      board_basis: 'Full Board (FB)',
      cost_price: 260,
      selling_price: 430,
      currency: 'USD',
      status: 'Active',
      inclusions: [
        'Full Board Meals (Breakfast, Lunch, Dinner Buffet / A La Carte)',
        'Sightseeing Shore Excursions with Egyptologist Guide'
      ]
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: CruiseService) => {
    setEditingCruise(c);
    setFormData({ ...c });
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
      duration_nights: Number(formData.duration_nights) || 4
    };

    if (editingCruise) {
      onUpdateCruise(editingCruise.id, payload);
    } else {
      onAddCruise(payload);
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

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cruises & Floating Hotels</h1>
            <p className="text-sm text-slate-500">Register Nile cruises, Dahabiyas, Red Sea charters, cabin allotments, and issue customer vouchers.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Cruise Ship</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Ships</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{cruises.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">In fleet & partner inventory</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">5-Star Deluxe / Ultra</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {cruises.filter(c => c.ship_rating?.includes('Luxury') || c.ship_rating?.includes('Deluxe')).length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">High-tier luxury vessels</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Board Included</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {cruises.filter(c => c.board_basis?.includes('Full Board') || c.board_basis?.includes('All-Inclusive')).length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">All main meals included</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Margin / Cabin</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {cruises.length > 0 
              ? `$${Math.round(cruises.reduce((acc, c) => acc + (c.selling_price - c.cost_price), 0) / cruises.length)}` 
              : '$0'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Net markup per passenger</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ship name, itinerary, or ports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Rating:</span>
            <select
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Ship Ratings</option>
              <option value="5-Star Ultra Luxury">5-Star Ultra Luxury</option>
              <option value="5-Star Deluxe">5-Star Deluxe</option>
              <option value="5-Star Standard">5-Star Standard</option>
              <option value="4-Star Superior">4-Star Superior</option>
              <option value="Dahabiya Sailing Boat">Dahabiya Sailing Boat</option>
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

      {/* Grid of Cruise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCruises.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Cruise Services Found</h3>
            <p className="text-xs text-slate-500 mt-1">Register a new Nile cruise or sailing vessel.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Cruise</span>
            </button>
          </div>
        ) : (
          filteredCruises.map((c) => {
            const profit = (c.selling_price || 0) - (c.cost_price || 0);
            return (
              <div 
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg flex items-center gap-1">
                      <Anchor className="w-3.5 h-3.5" />
                      {c.ship_rating}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      c.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {/* Title & Itinerary */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{c.cruise_name}</h3>
                    <p className="text-xs text-teal-700 font-semibold mt-1 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" />
                      {c.route_itinerary}
                    </p>
                  </div>

                  {/* Port Info & Cabin details */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-bold text-slate-800">{c.duration_nights} Nights / {c.duration_nights + 1} Days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Cabin Standard:</span>
                      <span className="font-semibold text-slate-800">{c.cabin_type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Meal Plan:</span>
                      <span className="font-semibold text-indigo-700 flex items-center gap-1">
                        <Utensils className="w-3 h-3" />
                        {c.board_basis}
                      </span>
                    </div>
                  </div>

                  {/* Ports Flow */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Embark</span>
                      <span className="font-medium text-slate-800 truncate block">{c.embarkation_port}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Disembark</span>
                      <span className="font-medium text-slate-800 truncate block">{c.disembarkation_port}</span>
                    </div>
                  </div>

                  {/* Inclusions */}
                  {c.inclusions && c.inclusions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 block">Cruise Inclusions:</span>
                      <div className="space-y-1">
                        {c.inclusions.slice(0, 2).map((inc, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Matrix */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Cabin Cost</span>
                      <span className="text-xs font-bold text-slate-700">{formatCurrency(c.cost_price, c.currency)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Rate / Pax</span>
                      <span className="text-xs font-extrabold text-teal-700">{formatCurrency(c.selling_price, c.currency)}</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Profit</span>
                      <span className="text-xs font-extrabold text-emerald-800">+{formatCurrency(profit, c.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-2 text-slate-500 hover:text-teal-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Cruise"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(c.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Cruise"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateVoucherForService?.('Cruise', c)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <Ship className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingCruise ? 'Edit Cruise Service' : 'Register New Cruise Vessel'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cruise Ship / Vessel Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.cruise_name || ''}
                    onChange={(e) => setFormData({ ...formData, cruise_name: e.target.value })}
                    placeholder="e.g. M/S Royal Princess 5-Star Nile Cruise"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ship Rating / Class</label>
                  <select
                    value={formData.ship_rating}
                    onChange={(e) => setFormData({ ...formData, ship_rating: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="5-Star Ultra Luxury">5-Star Ultra Luxury</option>
                    <option value="5-Star Deluxe">5-Star Deluxe</option>
                    <option value="5-Star Standard">5-Star Standard</option>
                    <option value="4-Star Superior">4-Star Superior</option>
                    <option value="Dahabiya Sailing Boat">Dahabiya Luxury Sailing Boat</option>
                    <option value="Red Sea Liveaboard">Red Sea Liveaboard Yacht</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration Nights</label>
                  <input
                    type="number"
                    value={formData.duration_nights || 4}
                    onChange={(e) => setFormData({ ...formData, duration_nights: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Route & Itinerary Program *</label>
                  <input
                    type="text"
                    list="cruise-itineraries"
                    required
                    value={formData.route_itinerary || ''}
                    onChange={(e) => setFormData({ ...formData, route_itinerary: e.target.value })}
                    placeholder="e.g. Luxor to Aswan (4 Nights / 5 Days)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                  <datalist id="cruise-itineraries">
                    {COMMON_ITINERARIES.map((it, i) => (
                      <option key={i} value={it} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Embarkation Port</label>
                  <input
                    type="text"
                    value={formData.embarkation_port || ''}
                    onChange={(e) => setFormData({ ...formData, embarkation_port: e.target.value })}
                    placeholder="e.g. Luxor Pier"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Disembarkation Port</label>
                  <input
                    type="text"
                    value={formData.disembarkation_port || ''}
                    onChange={(e) => setFormData({ ...formData, disembarkation_port: e.target.value })}
                    placeholder="e.g. Aswan Pier"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cabin Category</label>
                  <select
                    value={formData.cabin_type}
                    onChange={(e) => setFormData({ ...formData, cabin_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="Deluxe Nile View Cabin (Double)">Deluxe Nile View Cabin (Double)</option>
                    <option value="Standard Nile Cabin (Single)">Standard Nile Cabin (Single)</option>
                    <option value="Junior Suite">Junior Suite</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                    <option value="Royal Suite with Jacuzzi">Royal Suite with Jacuzzi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meal Board Basis</label>
                  <select
                    value={formData.board_basis}
                    onChange={(e) => setFormData({ ...formData, board_basis: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="Full Board (FB)">Full Board (FB) - All Meals</option>
                    <option value="All-Inclusive (AI)">All-Inclusive (AI) - Meals & Drinks</option>
                    <option value="Half Board (HB)">Half Board (HB) - Breakfast & Dinner</option>
                    <option value="Bed & Breakfast (BB)">Bed & Breakfast (BB)</option>
                  </select>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Financial Pricing</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cabin Cost (Net)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-teal-700 mb-1">Selling Rate / Passenger *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.selling_price || 0}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="w-full bg-teal-50 border border-teal-200 text-teal-900 rounded-xl px-3 py-1.5 text-sm font-bold"
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

              {/* Inclusions checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Cruise Inclusions Checklist</label>
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
                            ? 'bg-teal-50 border-teal-200 text-teal-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate mr-2">{inc}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
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
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingCruise ? 'Save Changes' : 'Register Cruise'}
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
            <h3 className="text-base font-bold text-slate-900">Delete Cruise Service</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Are you sure you want to delete this cruise from the system?</p>
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
                  if (deleteConfirmId) onDeleteCruise(deleteConfirmId);
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
