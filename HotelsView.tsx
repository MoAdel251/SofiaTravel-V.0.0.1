import React, { useState } from 'react';
import { Hotel as HotelIcon, Plus, MapPin, Phone, Mail, X } from 'lucide-react';
import { Hotel as HotelType } from '../types';

interface HotelsViewProps {
  hotels: HotelType[];
  onAddHotel: (data: Partial<HotelType>) => void;
}

export function HotelsView({ hotels, onAddHotel }: HotelsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<HotelType>>({
    hotel_name: '',
    country: 'Egypt',
    city: 'Cairo',
    address: '',
    contact_person: '',
    phone: '',
    email: '',
    room_types: 'Deluxe Room',
    contract_price: 150,
    selling_price: 220,
    currency: 'USD',
    check_in_time: '14:00',
    check_out_time: '12:00',
    notes: ''
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHotel(formData);
    setShowAddModal(false);
    setFormData({
      hotel_name: '',
      country: 'Egypt',
      city: 'Cairo',
      address: '',
      contact_person: '',
      phone: '',
      email: '',
      room_types: 'Deluxe Room',
      contract_price: 150,
      selling_price: 220,
      currency: 'USD',
      check_in_time: '14:00',
      check_out_time: '12:00',
      notes: ''
    });
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotels Management</h1>
          <p className="text-sm text-slate-500">Contracted partner hotels, room types, contract rates, check-in schedules, and pricing.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hotel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map(hotel => (
          <div key={hotel.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">{hotel.city}, {hotel.country}</span>
              <span className="text-lg font-extrabold text-slate-900">${hotel.selling_price} <span className="text-xs font-normal text-slate-500">/night</span></span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{hotel.hotel_name}</h3>
              <p className="text-xs text-slate-500 flex items-center mt-1"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {hotel.address}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-700">
              <p><strong>Rooms:</strong> {hotel.room_types}</p>
              <p><strong>Check-in:</strong> {hotel.check_in_time} | <strong>Check-out:</strong> {hotel.check_out_time}</p>
              <p><strong>Contact:</strong> {hotel.contact_person} ({hotel.phone})</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Hotel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Partner Hotel</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name</label>
                  <input
                    type="text"
                    required
                    value={formData.hotel_name}
                    onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                    placeholder="e.g. Marriott Mena House"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Cairo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Types</label>
                  <input
                    type="text"
                    required
                    value={formData.room_types}
                    onChange={(e) => setFormData({ ...formData, room_types: e.target.value })}
                    placeholder="e.g. Deluxe, Suite"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Cost Rate ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.contract_price}
                    onChange={(e) => setFormData({ ...formData, contract_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price / Night ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
