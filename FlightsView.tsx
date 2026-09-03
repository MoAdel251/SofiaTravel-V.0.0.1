import React, { useState } from 'react';
import { Plane, Plus, Upload, FileText, X } from 'lucide-react';
import { Flight } from '../types';

interface FlightsViewProps {
  flights: Flight[];
  onAddFlight: (data: Partial<Flight>) => void;
}

export function FlightsView({ flights, onAddFlight }: FlightsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Flight>>({
    airline: 'EgyptAir',
    flight_number: 'MS-101',
    departure_airport: 'LHR',
    arrival_airport: 'CAI',
    departure_date: '2026-09-10',
    departure_time: '10:00',
    arrival_date: '2026-09-10',
    arrival_time: '16:30',
    passenger: 'John Doe',
    booking_reference: 'PNR1234',
    ticket_number: '077-1234567',
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
      departure_date: '2026-09-10',
      departure_time: '10:00',
      arrival_date: '2026-09-10',
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

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flights Management</h1>
          <p className="text-sm text-slate-500">Airline tickets, PNR booking references, passenger itineraries, and ticket document uploads.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Flight</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Airline / Flight</th>
                <th className="py-3 px-4 font-semibold">Passenger</th>
                <th className="py-3 px-4 font-semibold">Route</th>
                <th className="py-3 px-4 font-semibold">PNR / Ticket</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Ticket Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flights.map(fl => (
                <tr key={fl.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{fl.airline} ({fl.flight_number})</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{fl.passenger}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{fl.departure_airport} → {fl.arrival_airport}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{fl.booking_reference}</td>
                  <td className="py-3.5 px-4 text-slate-600">{fl.departure_date} {fl.departure_time}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      {fl.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={fl.ticket_document_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-cyan-600 hover:text-cyan-700 text-xs font-semibold"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{fl.ticket_document_url ? 'View Ticket' : 'Ticket.pdf'}</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Flight Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Flight & Ticket</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Airline</label>
                  <input
                    type="text"
                    required
                    value={formData.airline}
                    onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                    placeholder="e.g. EgyptAir, Emirates"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flight Number</label>
                  <input
                    type="text"
                    required
                    value={formData.flight_number}
                    onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                    placeholder="e.g. MS-777"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passenger Name</label>
                  <input
                    type="text"
                    required
                    value={formData.passenger}
                    onChange={(e) => setFormData({ ...formData, passenger: e.target.value })}
                    placeholder="Passenger Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Reference (PNR)</label>
                  <input
                    type="text"
                    required
                    value={formData.booking_reference}
                    onChange={(e) => setFormData({ ...formData, booking_reference: e.target.value })}
                    placeholder="e.g. PNR8899"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Airport</label>
                  <input
                    type="text"
                    required
                    value={formData.departure_airport}
                    onChange={(e) => setFormData({ ...formData, departure_airport: e.target.value })}
                    placeholder="e.g. CAI"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Arrival Airport</label>
                  <input
                    type="text"
                    required
                    value={formData.arrival_airport}
                    onChange={(e) => setFormData({ ...formData, arrival_airport: e.target.value })}
                    placeholder="e.g. LHR"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={formData.departure_date}
                    onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price</label>
                  <input
                    type="number"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Cost Price</label>
                  <input
                    type="number"
                    required
                    value={formData.ticket_cost}
                    onChange={(e) => setFormData({ ...formData, ticket_cost: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Ticket File (PDF / Doc Link)</label>
                <input
                  type="text"
                  value={formData.ticket_document_url || ''}
                  onChange={(e) => setFormData({ ...formData, ticket_document_url: e.target.value })}
                  placeholder="Paste ticket file URL or document path (e.g. /tickets/ticket_101.pdf)"
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer"
                >
                  Save Flight Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
