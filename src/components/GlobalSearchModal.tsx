import React, { useState } from 'react';
import { Search, X, User, BookmarkCheck, Hotel, Plane, Truck } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  reservations: any[];
  hotels: any[];
  flights: any[];
  suppliers: any[];
}

export function GlobalSearchModal({ isOpen, onClose, customers, reservations, hotels, flights, suppliers }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase();
  const matchedCustomers = q ? customers.filter(c => c.full_name.toLowerCase().includes(q) || c.passport_number.toLowerCase().includes(q) || c.phone.includes(q)) : [];
  const matchedReservations = q ? reservations.filter(r => r.reservation_id.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)) : [];
  const matchedHotels = q ? hotels.filter(h => h.hotel_name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)) : [];
  const matchedFlights = q ? flights.filter(f => f.airline.toLowerCase().includes(q) || f.booking_reference.toLowerCase().includes(q) || f.passenger.toLowerCase().includes(q)) : [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type customer name, passport, PNR, reservation ID, destination..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500"
          />
          <button onClick={onClose} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {query && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {matchedCustomers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customers</h4>
                <div className="space-y-1">
                  {matchedCustomers.map(c => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100">
                      <span className="font-bold text-slate-900">{c.full_name} ({c.passport_number})</span>
                      <span className="text-slate-500">{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedReservations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reservations</h4>
                <div className="space-y-1">
                  {matchedReservations.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100">
                      <span className="font-bold text-slate-900">{r.reservation_id} - {r.destination}</span>
                      <span className="text-cyan-600 font-bold">${r.selling_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedFlights.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Flights</h4>
                <div className="space-y-1">
                  {matchedFlights.map(f => (
                    <div key={f.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100">
                      <span className="font-bold text-slate-900">{f.airline} ({f.booking_reference})</span>
                      <span className="text-slate-500">{f.passenger}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
