import React, { useState, useEffect } from 'react';
import { 
  BookmarkCheck, 
  Search, 
  Plus, 
  Filter, 
  Printer, 
  FileText, 
  MessageCircle, 
  Trash2, 
  Edit, 
  X,
  CheckCircle,
  DollarSign,
  Compass,
  Sparkles
} from 'lucide-react';
import { Reservation, ServiceType, ReservationStatus, Customer, Supplier, Employee, TourPackage } from '../types';

interface ReservationsViewProps {
  reservations: Reservation[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  packages?: TourPackage[];
  initialPackage?: TourPackage | null;
  onClearInitialPackage?: () => void;
  onAddReservation: (data: Partial<Reservation>) => void;
  onUpdateReservation: (id: string, data: Partial<Reservation>) => void;
  onDeleteReservation: (id: string) => void;
}

export function ReservationsView({
  reservations,
  customers,
  suppliers,
  employees,
  packages = [],
  initialPackage = null,
  onClearInitialPackage,
  onAddReservation,
  onUpdateReservation,
  onDeleteReservation
}: ReservationsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [autoPopulatedFrom, setAutoPopulatedFrom] = useState<string>('');
  const [confirmationModalRes, setConfirmationModalRes] = useState<Reservation | null>(null);
  const [invoiceModalRes, setInvoiceModalRes] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [deleteConfirmRes, setDeleteConfirmRes] = useState<Reservation | null>(null);

  const [formData, setFormData] = useState<Partial<Reservation>>({
    customer_id: customers[0]?.id || '',
    service_type: 'Travel Package',
    travel_date: '2026-09-15',
    return_date: '2026-09-22',
    number_of_travelers: 2,
    destination: 'Luxor & Aswan',
    supplier_id: suppliers[0]?.id || '',
    employee_id: employees[0]?.id || '',
    selling_price: 1500,
    cost_price: 1000,
    paid_amount: 500,
    currency: 'USD',
    reservation_status: 'Confirmed',
    notes: ''
  });

  // Auto-populate when initialPackage is passed (e.g. from TourPackages page click)
  useEffect(() => {
    if (initialPackage) {
      applyTourPackage(initialPackage);
      setShowAddModal(true);
      if (onClearInitialPackage) onClearInitialPackage();
    }
  }, [initialPackage]);

  const applyTourPackage = (pkg: TourPackage) => {
    setSelectedPackageId(pkg.id);
    setAutoPopulatedFrom(pkg.package_name);

    // Look for matching supplier if available
    const matchedSupplier = suppliers.find(s => 
      ( s.supplier_name || "" ).toLowerCase().includes('nile') || 
      ( s.supplier_name || "" ).toLowerCase().includes('safari') ||
      ( s.supplier_name || "" ).toLowerCase().includes('pyramid')
    ) || suppliers[0];

    setFormData(prev => ({
      ...prev,
      service_type: 'Travel Package',
      destination: `${pkg.package_name} (${pkg.destination})`,
      travel_date: pkg.start_date || prev.travel_date,
      return_date: pkg.end_date || prev.return_date,
      cost_price: pkg.cost,
      selling_price: pkg.selling_price,
      currency: pkg.currency || 'USD',
      supplier_id: matchedSupplier?.id || prev.supplier_id,
      notes: `Tour Package: ${pkg.package_name}\nDuration: ${pkg.duration}\nHotel: ${pkg.hotel}\nActivities: ${pkg.activities}\nIncluded: ${pkg.included_services?.join(', ')}`
    }));
  };

  const handlePackageDropdownChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    if (!pkgId) {
      setAutoPopulatedFrom('');
      return;
    }
    const pkg = packages.find(p => p.id === pkgId);
    if (pkg) {
      applyTourPackage(pkg);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = ( r.reservation_id || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          ( r.destination || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (r.customer_name && ( r.customer_name || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()));
    const matchesStatus = statusFilter === 'All' || r.reservation_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === formData.customer_id);
    const sup = suppliers.find(s => s.id === formData.supplier_id);
    const emp = employees.find(e => e.id === formData.employee_id);

    onAddReservation({
      ...formData,
      customer_name: cust?.full_name,
      supplier_name: sup?.supplier_name,
      employee_name: emp?.name
    });
    setShowAddModal(false);
    setAutoPopulatedFrom('');
    setSelectedPackageId('');
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservations Management</h1>
          <p className="text-sm text-slate-500">Track flights, hotels, tours, packages, financial margins, and statuses.</p>
        </div>
        <div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, destination, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Service</th>
                <th className="py-3 px-4 font-semibold">Destination</th>
                <th className="py-3 px-4 font-semibold">Travel Date</th>
                <th className="py-3 px-4 font-semibold">Selling / Profit</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map(res => (
                <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{res.reservation_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{res.customer_name || 'Customer'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {res.service_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{res.destination}</td>
                  <td className="py-3.5 px-4 text-slate-600">{res.travel_date}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">${res.selling_price}</div>
                    <div className="text-[10px] text-emerald-600 font-medium">Profit: ${res.profit}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      res.reservation_status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      res.reservation_status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                      res.reservation_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {res.reservation_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setEditingReservation({ ...res })}
                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="Edit Reservation"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmationModalRes(res)}
                        className="p-1.5 hover:bg-cyan-50 text-cyan-600 rounded-lg transition-colors cursor-pointer"
                        title="Booking Confirmation"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setInvoiceModalRes(res)}
                        className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                        title="Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://wa.me/?text=Booking%20Confirmation%20%23${res.reservation_id}%0ADestination:%20${encodeURIComponent(res.destination)}%0ATravel%20Date:%20${res.travel_date}%0ATotal:%20$${res.selling_price}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                        title="Send WhatsApp Confirmation"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setDeleteConfirmRes(res)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Reservation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reservation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Reservation</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              {/* Tour Package Auto-population Dropdown */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-amber-600" />
                    <span>Auto-Populate from Available Tour Packages</span>
                  </label>
                  {autoPopulatedFrom && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      <span>Loaded: {autoPopulatedFrom}</span>
                    </span>
                  )}
                </div>

                <select
                  value={selectedPackageId}
                  onChange={(e) => handlePackageDropdownChange(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Choose a tour package to automatically fill details --</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.package_name} ({pkg.destination} • {pkg.duration} • ${pkg.selling_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Flight">Flight</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Tour">Tour</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Visa">Visa</option>
                    <option value="Cruise">Cruise</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Travel Package">Travel Package</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Travelers</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.number_of_travelers}
                    onChange={(e) => setFormData({ ...formData, number_of_travelers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={formData.travel_date}
                    onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Amount ($)</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Currency</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.reservation_status}
                    onChange={(e) => setFormData({ ...formData, reservation_status: e.target.value as ReservationStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium shadow-sm"
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {confirmationModalRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">GLOBALWINGS TRAVEL</h2>
                <p className="text-xs text-slate-500">Official Booking Confirmation Voucher</p>
              </div>
              <button onClick={() => setConfirmationModalRes(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Reservation ID:</p>
                  <p className="text-cyan-600 font-bold text-sm">{confirmationModalRes.reservation_id}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Booking Date:</p>
                  <p>{confirmationModalRes.booking_date}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-1">Customer Information:</p>
                <p>Name: {confirmationModalRes.customer_name}</p>
                <p>Travelers: {confirmationModalRes.number_of_travelers}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-1">Trip Itinerary:</p>
                <p>Service: {confirmationModalRes.service_type}</p>
                <p>Destination: {confirmationModalRes.destination}</p>
                <p>Travel Date: {confirmationModalRes.travel_date} → Return: {confirmationModalRes.return_date}</p>
              </div>

              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-cyan-900">Total Price: ${confirmationModalRes.selling_price}</p>
                  <p className="text-[11px] text-cyan-700">Paid: ${confirmationModalRes.paid_amount} • Remaining: ${confirmationModalRes.remaining_amount}</p>
                </div>
                <span className="px-3 py-1 bg-cyan-600 text-white font-bold rounded-lg text-xs">{confirmationModalRes.reservation_status}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModalRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-900">GLOBALWINGS INVOICE</h2>
                <p className="text-xs text-slate-500">Tax Invoice #INV-2026-{invoiceModalRes.reservation_id}</p>
              </div>
              <button onClick={() => setInvoiceModalRes(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Billed To:</p>
                  <p className="text-sm font-bold">{invoiceModalRes.customer_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Date:</p>
                  <p>{invoiceModalRes.booking_date}</p>
                </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-medium">{invoiceModalRes.service_type} - {invoiceModalRes.destination}</td>
                    <td className="py-2 text-right">{invoiceModalRes.number_of_travelers}</td>
                    <td className="py-2 text-right font-bold">${invoiceModalRes.selling_price}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Due:</span>
                  <span>${invoiceModalRes.selling_price}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid Amount:</span>
                  <span>${invoiceModalRes.paid_amount}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Remaining Balance:</span>
                  <span>${invoiceModalRes.remaining_amount}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {editingReservation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Reservation</h3>
                <p className="text-xs text-slate-500">Ref: #{editingReservation.reservation_id || editingReservation.id.slice(0, 6)}</p>
              </div>
              <button onClick={() => setEditingReservation(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateReservation(editingReservation.id, editingReservation);
                setEditingReservation(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
                  <select
                    value={editingReservation.customer_id || ''}
                    onChange={(e) => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setEditingReservation({
                        ...editingReservation,
                        customer_id: e.target.value,
                        customer_name: cust?.full_name || editingReservation.customer_name
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={editingReservation.service_type || 'Travel Package'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, service_type: e.target.value as ServiceType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Flight">Flight</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Tour">Tour</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Visa">Visa</option>
                    <option value="Cruise">Cruise</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Travel Package">Travel Package</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={editingReservation.destination || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, destination: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travelers Count *</label>
                  <input
                    type="number"
                    min={1}
                    value={editingReservation.number_of_travelers || 1}
                    onChange={(e) => setEditingReservation({ ...editingReservation, number_of_travelers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={editingReservation.travel_date || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, travel_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={editingReservation.return_date || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, return_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingReservation.selling_price || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const paid = editingReservation.paid_amount || 0;
                      setEditingReservation({ 
                        ...editingReservation, 
                        selling_price: val,
                        remaining_amount: Math.max(0, val - paid)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold text-cyan-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingReservation.cost_price || 0}
                    onChange={(e) => setEditingReservation({ ...editingReservation, cost_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Amount ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingReservation.paid_amount || 0}
                    onChange={(e) => {
                      const paid = Number(e.target.value);
                      const selling = editingReservation.selling_price || 0;
                      setEditingReservation({ 
                        ...editingReservation, 
                        paid_amount: paid,
                        remaining_amount: Math.max(0, selling - paid)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingReservation.reservation_status || 'Confirmed'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, reservation_status: e.target.value as ReservationStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Special Requests</label>
                <textarea
                  rows={2}
                  value={editingReservation.notes || ''}
                  onChange={(e) => setEditingReservation({ ...editingReservation, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReservation(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes / Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Reservation</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete reservation <span className="font-semibold text-slate-800">#{deleteConfirmRes.reservation_id || deleteConfirmRes.id.slice(0, 6)}</span> for <span className="font-semibold text-slate-800">{deleteConfirmRes.customer_name}</span>?
                <br />(Manager authorization will be requested if not authorized)
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRes(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReservation(deleteConfirmRes.id);
                  setDeleteConfirmRes(null);
                }}
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
