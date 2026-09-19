import React, { useState } from 'react';
import { 
  Plane, 
  Plus, 
  Upload, 
  FileText, 
  X, 
  Edit3, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { Flight } from '../types';

interface FlightsViewProps {
  flights: Flight[];
  onAddFlight: (data: Partial<Flight>) => void;
  onUpdateFlight?: (id: string, data: Partial<Flight>) => void;
  onDeleteFlight?: (id: string) => void;
}

export function FlightsView({ 
  flights = [], 
  onAddFlight, 
  onUpdateFlight, 
  onDeleteFlight 
}: FlightsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [deleteConfirmFlight, setDeleteConfirmFlight] = useState<Flight | null>(null);

  const [formData, setFormData] = useState<Partial<Flight>>({
    airline: 'EgyptAir',
    flight_number: 'MS-101',
    departure_airport: 'LHR',
    arrival_airport: 'CAI',
    departure_date: '2026-09-15',
    departure_time: '10:00',
    arrival_date: '2026-09-15',
    arrival_time: '16:30',
    passenger: '',
    booking_reference: '',
    ticket_number: '',
    ticket_cost: 400,
    selling_price: 600,
    currency: 'USD',
    status: 'Confirmed'
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFlight(formData);
    setShowAddModal(false);
    setFormData({
      airline: 'EgyptAir',
      flight_number: 'MS-101',
      departure_airport: 'LHR',
      arrival_airport: 'CAI',
      departure_date: '2026-09-15',
      departure_time: '10:00',
      arrival_date: '2026-09-15',
      arrival_time: '16:30',
      passenger: '',
      booking_reference: '',
      ticket_number: '',
      ticket_cost: 400,
      selling_price: 600,
      currency: 'USD',
      status: 'Confirmed'
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFlight && onUpdateFlight) {
      onUpdateFlight(editingFlight.id, editingFlight);
      setEditingFlight(null);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmFlight && onDeleteFlight) {
      onDeleteFlight(deleteConfirmFlight.id);
      setDeleteConfirmFlight(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Plane className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Flights & Ticketing Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Airline reservations, PNR booking references, passenger itineraries, tickets, and costs.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Flight</span>
        </button>
      </div>

      {/* Table / List */}
      {flights.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Plane className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Flights Logged Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add your first airline flight booking to track passenger PNR and ticket status.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Flight</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Airline / Flight</th>
                  <th className="py-3.5 px-4 font-semibold">Passenger</th>
                  <th className="py-3.5 px-4 font-semibold">Route</th>
                  <th className="py-3.5 px-4 font-semibold">PNR / Ticket</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Rate</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map(fl => (
                  <tr key={fl.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {fl.airline} <span className="text-xs font-mono text-indigo-600">({fl.flight_number})</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{fl.passenger}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {fl.departure_airport} → {fl.arrival_airport}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      <div>PNR: <strong className="text-slate-800">{fl.booking_reference || 'N/A'}</strong></div>
                      {fl.ticket_number && <div className="text-[11px] text-slate-400">Tk: {fl.ticket_number}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{fl.departure_date}</div>
                      <div className="text-[11px] text-slate-400">{fl.departure_time}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">${fl.selling_price || 0}</span>
                      <span className="text-[10px] text-slate-400 block">Cost: ${fl.ticket_cost || 0}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        fl.status === 'Confirmed' || fl.status === 'Ticketed' || fl.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700' 
                          : fl.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {fl.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {onUpdateFlight && (
                          <button
                            onClick={() => setEditingFlight({ ...fl })}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Flight"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteFlight && (
                          <button
                            onClick={() => setDeleteConfirmFlight(fl)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Flight"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Flight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Add New Flight & Ticket</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Airline *</label>
                  <input
                    type="text"
                    required
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    placeholder="e.g. EgyptAir, Emirates"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.flight_number}
                    onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                    placeholder="e.g. MS-101"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passenger Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.passenger}
                    onChange={(e) => setFormData({ ...formData, passenger: e.target.value })}
                    placeholder="e.g. Mohamed Ali"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PNR / Booking Reference</label>
                  <input
                    type="text"
                    value={formData.booking_reference}
                    onChange={(e) => setFormData({ ...formData, booking_reference: e.target.value })}
                    placeholder="e.g. 6XYZ12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Airport *</label>
                  <input
                    type="text"
                    required
                    value={formData.departure_airport}
                    onChange={(e) => setFormData({ ...formData, departure_airport: e.target.value })}
                    placeholder="e.g. Cairo (CAI)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Arrival Airport *</label>
                  <input
                    type="text"
                    required
                    value={formData.arrival_airport}
                    onChange={(e) => setFormData({ ...formData, arrival_airport: e.target.value })}
                    placeholder="e.g. London Heathrow (LHR)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      required
                      value={formData.departure_date}
                      onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Arrival Date & Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={formData.arrival_date}
                      onChange={(e) => setFormData({ ...formData, arrival_date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="time"
                      value={formData.arrival_time}
                      onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                  <select
                    value={formData.currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">U.S. Dollar (USD)</option>
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Cost *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.ticket_cost}
                    onChange={(e) => setFormData({ ...formData, ticket_cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold text-indigo-700"
                  />
                </div>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Flight Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flight Modal */}
      {editingFlight && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Flight Ticket</h3>
                <p className="text-xs text-slate-500">Update passenger, flight timing, or ticket pricing.</p>
              </div>
              <button onClick={() => setEditingFlight(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Airline *</label>
                  <input
                    type="text"
                    required
                    value={editingFlight.airline || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, airline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    required
                    value={editingFlight.flight_number || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, flight_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passenger Name *</label>
                  <input
                    type="text"
                    required
                    value={editingFlight.passenger || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, passenger: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PNR / Reference</label>
                  <input
                    type="text"
                    value={editingFlight.booking_reference || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, booking_reference: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Airport *</label>
                  <input
                    type="text"
                    required
                    value={editingFlight.departure_airport || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, departure_airport: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Arrival Airport *</label>
                  <input
                    type="text"
                    required
                    value={editingFlight.arrival_airport || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, arrival_airport: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date</label>
                  <input
                    type="date"
                    value={editingFlight.departure_date || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, departure_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    value={editingFlight.departure_time || ''}
                    onChange={(e) => setEditingFlight({ ...editingFlight, departure_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                  <select
                    value={editingFlight.currency || 'USD'}
                    onChange={(e) => setEditingFlight({ ...editingFlight, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USD">U.S. Dollar (USD)</option>
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Cost *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingFlight.ticket_cost || 0}
                    onChange={(e) => setEditingFlight({ ...editingFlight, ticket_cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingFlight.selling_price || 0}
                    onChange={(e) => setEditingFlight({ ...editingFlight, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingFlight.status || 'Confirmed'}
                    onChange={(e) => setEditingFlight({ ...editingFlight, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Reserved">Reserved</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Ticketed">Ticketed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingFlight(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes / Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFlight && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Flight Ticket</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete flight <span className="font-semibold text-slate-800">"{deleteConfirmFlight.airline} {deleteConfirmFlight.flight_number} - {deleteConfirmFlight.passenger}"</span>?
                <br />(Manager authorization will be requested if not authorized)
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmFlight(null)}
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
