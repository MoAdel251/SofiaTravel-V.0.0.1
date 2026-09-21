import React, { useState } from 'react';
import { 
  Car, 
  Search, 
  Plus, 
  Filter, 
  MapPin, 
  Users, 
  Briefcase, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  Phone, 
  Ticket, 
  ShieldCheck, 
  AlertCircle,
  Navigation
} from 'lucide-react';
import { TransferService, VehicleType, Supplier } from '../types';
import { formatCurrency } from '../utils/currency';
import { CurrencyHighlight } from './CurrencyHighlight';

interface TransfersViewProps {
  transfers: TransferService[];
  suppliers?: Supplier[];
  onAddTransfer: (data: Partial<TransferService>) => void;
  onUpdateTransfer: (id: string, data: Partial<TransferService>) => void;
  onDeleteTransfer: (id: string) => void;
  onCreateVoucherForService?: (category: 'Transfer', service: TransferService) => void;
}

const COMMON_PICKUP_POINTS = [
  'Cairo International Airport (CAI)',
  'Sphinx International Airport (SPX)',
  'Hurghada International Airport (HRG)',
  'Sharm El Sheikh International Airport (SSH)',
  'Luxor International Airport (LXR)',
  'Aswan International Airport (ASW)',
  'Alexandria Borg El Arab Airport (HBE)',
  'Downtown Cairo Hotels',
  'Giza Pyramids Hotels',
  'New Cairo / Tagamoa',
  'Alexandria Corniche Hotels',
  'Ain Sokhna Resorts',
  'El Gouna Hotels'
];

const VEHICLE_TYPES: VehicleType[] = [
  'Sedan / Limousine (1-3 Pax)',
  'SUV / Minivan (1-6 Pax)',
  'HiAce Van (1-14 Pax)',
  'Coaster Minibus (1-24 Pax)',
  'Coach Bus (1-50 Pax)'
];

const PRESET_AMENITIES = [
  'Full Air Conditioning (AC)',
  'Bottled Mineral Water',
  'Free Onboard Wi-Fi',
  'Flight Tracking & Delayed Wait Time',
  'Airport Name Sign Board (Meet & Greet)',
  'Child Safety Seat Available',
  'Professional English-speaking Driver'
];

export function TransfersView({
  transfers = [],
  suppliers = [],
  onAddTransfer,
  onUpdateTransfer,
  onDeleteTransfer,
  onCreateVoucherForService
}: TransfersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<TransferService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TransferService>>({
    service_title: 'Cairo Airport (CAI) to Downtown / Giza Hotels Transfer',
    transfer_type: 'Airport Pickup',
    vehicle_type: 'Sedan / Limousine (1-3 Pax)',
    pickup_location: 'Cairo International Airport (CAI)',
    dropoff_location: 'Downtown Cairo / Giza Hotels',
    max_passengers: 3,
    max_luggage: 3,
    distance_km: 35,
    estimated_duration: '45 - 60 Minutes',
    cost_price: 25,
    selling_price: 45,
    currency: 'USD',
    meet_and_greet: true,
    includes_tolls: true,
    amenities: ['Full Air Conditioning (AC)', 'Bottled Mineral Water', 'Airport Name Sign Board (Meet & Greet)'],
    driver_name: 'Sofia Travel Dedicated Fleet',
    driver_phone: '+20 100 123 4567',
    status: 'Active',
    notes: 'Driver will meet guest at terminal exit with Sofia Travel name signboard.'
  });

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = 
      t.service_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.dropoff_location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || t.transfer_type === typeFilter;
    const matchesVehicle = vehicleFilter === 'All' || t.vehicle_type === vehicleFilter;
    return matchesSearch && matchesType && matchesVehicle;
  });

  const handleOpenAdd = () => {
    setEditingTransfer(null);
    setFormData({
      service_title: 'Airport Transfer Route',
      transfer_type: 'Airport Pickup',
      vehicle_type: 'HiAce Van (1-14 Pax)',
      pickup_location: 'Cairo International Airport (CAI)',
      dropoff_location: 'Giza Hotels',
      max_passengers: 10,
      max_luggage: 10,
      estimated_duration: '1 Hour',
      cost_price: 40,
      selling_price: 75,
      currency: 'USD',
      meet_and_greet: true,
      includes_tolls: true,
      amenities: ['Full Air Conditioning (AC)', 'Bottled Mineral Water'],
      status: 'Active'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (t: TransferService) => {
    setEditingTransfer(t);
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
      max_passengers: Number(formData.max_passengers) || 3,
      max_luggage: Number(formData.max_luggage) || 3
    };

    if (editingTransfer) {
      onUpdateTransfer(editingTransfer.id, payload);
    } else {
      onAddTransfer(payload);
    }
    setShowAddModal(false);
  };

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities || [];
    if (current.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: current.filter(a => a !== amenity)
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...current, amenity]
      });
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transfers & Transportation Fleet</h1>
            <p className="text-sm text-slate-500">Manage airport pickups, intercity private shuttles, limousines, minibuses, and dispatch vouchers.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Transfer Route</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Routes</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{transfers.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Scheduled transfer lines</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Airport Pickups / Dropoffs</span>
          <div className="text-2xl font-bold text-sky-600 mt-1">
            {transfers.filter(t => t.transfer_type?.includes('Airport')).length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Flight arrivals & departures</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intercity Routes</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {transfers.filter(t => t.transfer_type === 'Intercity Transfer').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Cairo - Alexandria - Sokhna</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meet & Greet Included</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {transfers.filter(t => t.meet_and_greet).length}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">Terminal signboard service</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by pickup, destination, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Route Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Transfer Types</option>
              <option value="Airport Pickup">Airport Pickup</option>
              <option value="Airport Dropoff">Airport Dropoff</option>
              <option value="Intercity Transfer">Intercity Transfer</option>
              <option value="City Tour By Hours">City Tour By Hours</option>
              <option value="Port Transfer">Port Transfer</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Vehicle:</span>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Vehicle Classes</option>
              {VEHICLE_TYPES.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Transfer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTransfers.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Transfer Routes Found</h3>
            <p className="text-xs text-slate-500 mt-1">Register a new airport or intercity route to begin booking.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Transfer</span>
            </button>
          </div>
        ) : (
          filteredTransfers.map((t) => {
            const profit = (t.selling_price || 0) - (t.cost_price || 0);
            return (
              <div 
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />
                      {t.transfer_type}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      t.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{t.service_title}</h3>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">{t.vehicle_type}</p>
                  </div>

                  {/* Route Route Flow */}
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-100">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Pickup</span>
                        <span className="font-semibold text-slate-800">{t.pickup_location}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Dropoff</span>
                        <span className="font-semibold text-slate-800">{t.dropoff_location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity & Timing */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Max <strong>{t.max_passengers}</strong> Pax</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg">
                      <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                      <span>Max <strong>{t.max_luggage}</strong> Bags</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  {t.amenities && t.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.amenities.slice(0, 3).map((am, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          ✓ {am}
                        </span>
                      ))}
                      {t.amenities.length > 3 && (
                        <span className="text-[10px] font-bold text-sky-600 px-1 py-0.5">
                          +{t.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price Matrix */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Vehicle Cost</span>
                      <span className="text-xs font-bold text-slate-700">
                        <CurrencyHighlight amount={t.cost_price} currency={t.currency} />
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Rate / Trip</span>
                      <span className="text-xs font-extrabold text-sky-700">
                        <CurrencyHighlight amount={t.selling_price} currency={t.currency} />
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Profit</span>
                      <span className="text-xs font-extrabold text-emerald-800">
                        <CurrencyHighlight amount={profit} currency={t.currency} prefix="+" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 text-slate-500 hover:text-sky-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Transfer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(t.id)}
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Transfer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateVoucherForService?.('Transfer', t)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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

      {/* Modal Add / Edit Transfer */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTransfer ? 'Edit Transfer Route' : 'Register New Transfer Route'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Route / Service Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.service_title || ''}
                    onChange={(e) => setFormData({ ...formData, service_title: e.target.value })}
                    placeholder="e.g. Cairo Airport to Downtown Hotels VIP Transfer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Type</label>
                  <select
                    value={formData.transfer_type}
                    onChange={(e) => setFormData({ ...formData, transfer_type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="Airport Pickup">Airport Pickup</option>
                    <option value="Airport Dropoff">Airport Dropoff</option>
                    <option value="Intercity Transfer">Intercity Transfer</option>
                    <option value="City Tour By Hours">City Tour By Hours</option>
                    <option value="Port Transfer">Port Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Class *</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value as VehicleType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    {VEHICLE_TYPES.map((v, i) => (
                      <option key={i} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Location *</label>
                  <input
                    type="text"
                    list="pickup-points"
                    required
                    value={formData.pickup_location || ''}
                    onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                    placeholder="e.g. Cairo Airport Terminal 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                  <datalist id="pickup-points">
                    {COMMON_PICKUP_POINTS.map((p, i) => (
                      <option key={i} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dropoff Location *</label>
                  <input
                    type="text"
                    list="dropoff-points"
                    required
                    value={formData.dropoff_location || ''}
                    onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                    placeholder="e.g. Mena House Giza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                  <datalist id="dropoff-points">
                    {COMMON_PICKUP_POINTS.map((p, i) => (
                      <option key={i} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Passenger Capacity</label>
                  <input
                    type="number"
                    value={formData.max_passengers || 3}
                    onChange={(e) => setFormData({ ...formData, max_passengers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Luggage Bags</label>
                  <input
                    type="number"
                    value={formData.max_luggage || 3}
                    onChange={(e) => setFormData({ ...formData, max_luggage: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Duration</label>
                  <input
                    type="text"
                    value={formData.estimated_duration || ''}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                    placeholder="e.g. 45 - 60 Minutes"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Fleet Partner</label>
                  <select
                    value={formData.supplier_id || ''}
                    onChange={(e) => {
                      const sup = suppliers.find(s => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        supplier_id: e.target.value,
                        supplier_name: sup ? sup.name : ''
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="">Sofia Travel In-House Fleet</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Financial Pricing</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cost Price (Supplier/Gas)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-sky-700 mb-1">Selling Rate to Customer *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.selling_price || 0}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="w-full bg-sky-50 border border-sky-200 text-sky-900 rounded-xl px-3 py-1.5 text-sm font-bold"
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

              {/* Amenities checkboxes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Included Amenities</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {PRESET_AMENITIES.map((am, i) => {
                    const isChecked = formData.amenities?.includes(am);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleAmenity(am)}
                        className={`text-left text-xs p-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-sky-50 border-sky-200 text-sky-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate mr-2">{am}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
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
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingTransfer ? 'Save Changes' : 'Register Route'}
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
            <h3 className="text-base font-bold text-slate-900">Delete Transfer Route</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Are you sure you want to delete this route from the system?</p>
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
                  if (deleteConfirmId) onDeleteTransfer(deleteConfirmId);
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
