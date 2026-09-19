import React, { useState } from 'react';
import { 
  Hotel as HotelIcon, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  X, 
  Edit3, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { Hotel as HotelType } from '../types';

interface HotelsViewProps {
  hotels: HotelType[];
  onAddHotel: (data: Partial<HotelType>) => void;
  onUpdateHotel?: (id: string, data: Partial<HotelType>) => void;
  onDeleteHotel?: (id: string) => void;
}

export function HotelsView({ 
  hotels = [], 
  onAddHotel, 
  onUpdateHotel, 
  onDeleteHotel 
}: HotelsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelType | null>(null);
  const [deleteConfirmHotel, setDeleteConfirmHotel] = useState<HotelType | null>(null);

  const [formData, setFormData] = useState<Partial<HotelType>>({
    hotel_name: '',
    country: 'Egypt',
    city: 'Cairo',
    address: '',
    contact_person: '',
    phone: '',
    email: '',
    room_types: 'Deluxe Room, Standard Room',
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
      room_types: 'Deluxe Room, Standard Room',
      contract_price: 150,
      selling_price: 220,
      currency: 'USD',
      check_in_time: '14:00',
      check_out_time: '12:00',
      notes: ''
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHotel && onUpdateHotel) {
      onUpdateHotel(editingHotel.id, editingHotel);
      setEditingHotel(null);
    }
  };

  const handleDelete = () => {
    if (deleteConfirmHotel && onDeleteHotel) {
      onDeleteHotel(deleteConfirmHotel.id);
      setDeleteConfirmHotel(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/20">
              <HotelIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Hotels & Accommodation Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Contracted partner hotels, room types, contract rates, check-in schedules, and room inventory.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hotel</span>
        </button>
      </div>

      {/* Grid */}
      {hotels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <HotelIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Partner Hotels Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add your first partner hotel to manage contracted pricing and bookings.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Hotel</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(hotel => (
            <div key={hotel.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                    {hotel.city}, {hotel.country}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {onUpdateHotel && (
                      <button
                        onClick={() => setEditingHotel({ ...hotel })}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Hotel"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteHotel && (
                      <button
                        onClick={() => setDeleteConfirmHotel(hotel)}
                        className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Hotel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{hotel.hotel_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    <span>{hotel.address || `${hotel.city}, ${hotel.country}`}</span>
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                  <p><strong>Room Types:</strong> {hotel.room_types || 'Standard'}</p>
                  <p><strong>Check-in / Check-out:</strong> {hotel.check_in_time || '14:00'} / {hotel.check_out_time || '12:00'}</p>
                  {hotel.contact_person && (
                    <p><strong>Contact:</strong> {hotel.contact_person} {hotel.phone ? `(${hotel.phone})` : ''}</p>
                  )}
                  {hotel.email && (
                    <p className="truncate"><strong>Email:</strong> {hotel.email}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Contract Rate</span>
                  <p className="text-xs font-semibold text-slate-600">${hotel.contract_price || 0} /night</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Selling Rate</span>
                  <p className="text-base font-extrabold text-blue-700">${hotel.selling_price || 0} <span className="text-[10px] font-normal text-slate-500">/night</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hotel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Add New Partner Hotel</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.hotel_name}
                    onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                    placeholder="e.g. Marriott Mena House"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Cairo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. Egypt"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Pyramids Road, Giza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                  <select
                    value={formData.currency || 'USD'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="USD">U.S. Dollar (USD)</option>
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Rate *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.contract_price}
                    onChange={(e) => setFormData({ ...formData, contract_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Rate *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Reservation Manager"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20 100 000 0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="reservations@hotel.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Types</label>
                  <input
                    type="text"
                    value={formData.room_types}
                    onChange={(e) => setFormData({ ...formData, room_types: e.target.value })}
                    placeholder="Deluxe, Superior, Suite"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Partner Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hotel Modal */}
      {editingHotel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Hotel Details</h3>
                <p className="text-xs text-slate-500">Update rates, contacts, or room categories.</p>
              </div>
              <button onClick={() => setEditingHotel(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hotel Name *</label>
                  <input
                    type="text"
                    required
                    value={editingHotel.hotel_name || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, hotel_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={editingHotel.city || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editingHotel.country || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editingHotel.address || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                  <select
                    value={editingHotel.currency || 'USD'}
                    onChange={(e) => setEditingHotel({ ...editingHotel, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="USD">U.S. Dollar (USD)</option>
                    <option value="EGP">Egyptian Pound (EGP)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Rate *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingHotel.contract_price || 0}
                    onChange={(e) => setEditingHotel({ ...editingHotel, contract_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Rate *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingHotel.selling_price || 0}
                    onChange={(e) => setEditingHotel({ ...editingHotel, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editingHotel.contact_person || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, contact_person: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingHotel.phone || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingHotel.email || ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room Types</label>
                  <input
                    type="text"
                    value={typeof editingHotel.room_types === 'string' ? editingHotel.room_types : ''}
                    onChange={(e) => setEditingHotel({ ...editingHotel, room_types: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingHotel(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes / Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmHotel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Partner Hotel</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteConfirmHotel.hotel_name}"</span>?
                <br />(Manager authorization will be requested if not authorized)
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmHotel(null)}
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
