import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Plus, 
  Filter, 
  Globe2, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  X, 
  FileText, 
  AlertCircle,
  Sparkles,
  Ticket,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { VisaService, VisaType, VisaEntry, Supplier, UserRole } from '../types';
import { formatCurrency } from '../utils/currency';
import { CurrencyHighlight } from './CurrencyHighlight';

interface VisasViewProps {
  visas: VisaService[];
  suppliers?: Supplier[];
  customers?: any[];
  userRole?: UserRole;
  onAddVisa: (data: Partial<VisaService>) => void;
  onUpdateVisa: (id: string, data: Partial<VisaService>) => void;
  onDeleteVisa: (id: string) => void;
  onCreateVoucherForService?: (category: 'Visa', service: VisaService) => void;
}

const COMMON_COUNTRIES = [
  'Egypt (Entry Visa / E-Visa)',
  'Saudi Arabia (Umrah / Tourist)',
  'United Arab Emirates (Dubai / Abu Dhabi)',
  'Turkey (E-Visa / Regular)',
  'Schengen (France, Germany, Italy, Spain)',
  'United Kingdom (Standard Visitor)',
  'United States (B1/B2 Visitor)',
  'Jordan (Tourist Visa)',
  'Qatar (Hayya / Tourist Entry)',
  'Thailand (Tourist / Visa On Arrival)',
  'China (Commercial / Tourist)',
  'Oman (E-Visa)',
  'Georgia (E-Visa)',
  'Morocco (Tourist Entry)'
];

const PRESET_DOCUMENT_REQUIREMENTS = [
  'Valid Passport (6+ months validity remaining)',
  '2 Recent Passport-size White Background Photos',
  'HR Letter / Employment Proof with Salary & Position',
  'Official 6-Month Bank Statement stamped by bank',
  'Confirmed Roundtrip Flight Reservation',
  'Confirmed Hotel Accommodation / Voucher',
  'Travel Health Insurance Policy (Min €30,000 coverage for Schengen)',
  'National ID / Family Book copy',
  'Commercial Register & Tax Card (for business owners)'
];

export function VisasView({
  visas = [],
  suppliers = [],
  customers = [],
  userRole = 'Administrator',
  onAddVisa,
  onUpdateVisa,
  onDeleteVisa,
  onCreateVoucherForService
}: VisasViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVisa, setEditingVisa] = useState<VisaService | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<VisaService>>({
    country: 'Saudi Arabia (Umrah / Tourist)',
    visa_title: 'Saudi Arabia 1-Year Multiple Entry Tourist / Umrah E-Visa',
    visa_type: 'Tourist',
    entry_type: 'Multiple Entry',
    validity_duration: '365 Days (90 Days stay per entry)',
    processing_time: '24 - 48 Hours',
    submission_method: 'Online E-Visa',
    embassy_consular_fee: 140,
    agency_fee: 35,
    cost_price: 140,
    selling_price: 175,
    currency: 'USD',
    status: 'Active',
    required_documents: [
      'Valid Passport (6+ months validity remaining)',
      '1 Passport-size photo with white background'
    ],
    notes: 'Includes full mandatory medical insurance approved by the Ministry of Foreign Affairs.'
  });

  const [newDocInput, setNewDocInput] = useState('');

  const filteredVisas = visas.filter(v => {
    const matchesSearch = 
      v.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visa_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.submission_method?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || v.visa_type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingVisa(null);
    setFormData({
      country: 'Egypt (Entry Visa / E-Visa)',
      visa_title: 'Egypt 30-Day Single Entry Tourist Visa',
      visa_type: 'Tourist',
      entry_type: 'Single Entry',
      validity_duration: '90 Days from issue',
      processing_time: '2-4 Business Days',
      submission_method: 'Online E-Visa',
      embassy_consular_fee: 25,
      agency_fee: 20,
      cost_price: 25,
      selling_price: 45,
      currency: 'USD',
      status: 'Active',
      required_documents: [
        'Valid Passport (6+ months validity remaining)',
        'Passport Scan',
        'Hotel booking confirmation'
      ],
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (v: VisaService) => {
    setEditingVisa(v);
    setFormData({ ...v });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const embassy = Number(formData.embassy_consular_fee) || 0;
    const agency = Number(formData.agency_fee) || 0;
    const cost = Number(formData.cost_price) || embassy;
    const selling = Number(formData.selling_price) || (cost + agency);

    const payload = {
      ...formData,
      embassy_consular_fee: embassy,
      agency_fee: agency,
      cost_price: cost,
      selling_price: selling
    };

    if (editingVisa) {
      onUpdateVisa(editingVisa.id, payload);
    } else {
      onAddVisa(payload);
    }
    setShowAddModal(false);
  };

  const toggleDocument = (docName: string) => {
    const current = formData.required_documents || [];
    if (current.includes(docName)) {
      setFormData({
        ...formData,
        required_documents: current.filter(d => d !== docName)
      });
    } else {
      setFormData({
        ...formData,
        required_documents: [...current, docName]
      });
    }
  };

  const addCustomDoc = () => {
    if (!newDocInput.trim()) return;
    const current = formData.required_documents || [];
    if (!current.includes(newDocInput.trim())) {
      setFormData({
        ...formData,
        required_documents: [...current, newDocInput.trim()]
      });
    }
    setNewDocInput('');
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Visa Services & Processing</h1>
              <p className="text-sm text-slate-500">Register and manage entry visas, tourist visas, consular fees, document checklists, and issue customer vouchers.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Visa Service</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Countries</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {new Set(visas.map(v => v.country)).size}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Active destinations available</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Visa Packages</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {visas.filter(v => v.status === 'Active').length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Ready for customer booking</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online E-Visas</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {visas.filter(v => v.submission_method === 'Online E-Visa').length}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">Instant electronic processing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Agency Markup</span>
          <div className="text-2xl font-bold text-cyan-600 mt-1">
            {visas.length > 0 
              ? `$${Math.round(visas.reduce((acc, v) => acc + (v.selling_price - v.cost_price), 0) / visas.length)}` 
              : '$0'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Net profit per visa applicant</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by country, visa title, or submission type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Visa Types</option>
              <option value="Tourist">Tourist</option>
              <option value="Business">Business</option>
              <option value="Transit">Transit</option>
              <option value="Work / Employment">Work / Employment</option>
              <option value="Umrah / Religious">Umrah / Religious</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visa Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVisas.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Globe2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Visa Services Found</h3>
            <p className="text-xs text-slate-500 mt-1">Register new visa requirements or adjust your filters above.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Visa Service</span>
            </button>
          </div>
        ) : (
          filteredVisas.map((v) => {
            const profit = (v.selling_price || 0) - (v.cost_price || 0);
            return (
              <div 
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1">
                        <Globe2 className="w-3 h-3" />
                        {v.country}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                        {v.visa_type}
                      </span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-lg">
                        {v.entry_type}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      v.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{v.visa_title}</h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Processing: <strong>{v.processing_time}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Validity: {v.validity_duration}</span>
                    </p>
                  </div>

                  {/* Submission Method & Supplier */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold text-slate-800">{v.submission_method}</span>
                    </div>
                    {v.supplier_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Partner / Supplier:</span>
                        <span className="font-medium text-slate-800">{v.supplier_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Document Requirements Preview */}
                  {v.required_documents && v.required_documents.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-slate-700 block">Required Checklist ({v.required_documents.length}):</span>
                      <ul className="text-xs text-slate-600 space-y-1 pl-1">
                        {v.required_documents.slice(0, 3).map((doc, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{doc}</span>
                          </li>
                        ))}
                        {v.required_documents.length > 3 && (
                          <li className="text-xs text-indigo-600 font-semibold pl-5">
                            +{v.required_documents.length - 3} more required items
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Pricing Matrix */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Embassy Fee</span>
                      <span className="text-xs font-bold text-slate-700">
                        <CurrencyHighlight amount={v.cost_price} currency={v.currency} />
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Selling Price</span>
                      <span className="text-xs font-extrabold text-indigo-700">
                        <CurrencyHighlight amount={v.selling_price} currency={v.currency} />
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <span className="text-emerald-700 text-[10px] uppercase font-bold block">Profit</span>
                      <span className="text-xs font-extrabold text-emerald-800">
                        <CurrencyHighlight amount={profit} currency={v.currency} prefix="+" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(v)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant'
                          ? 'text-slate-500 hover:text-indigo-600 hover:bg-white'
                          : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                      }`}
                      title={
                        userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant'
                          ? "Edit Visa Service"
                          : "Request Admin Permission to Edit Visa Service (Requires Stated Reason)"
                      }
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (userRole !== 'Administrator' && userRole !== 'Manager' && userRole !== 'Accountant') {
                          onDeleteVisa(v.id);
                        } else {
                          setDeleteConfirmId(v.id);
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant'
                          ? 'text-slate-500 hover:text-rose-600 hover:bg-white'
                          : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                      }`}
                      title={
                        userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant'
                          ? "Delete Visa Service"
                          : "Request Admin Permission to Delete Visa Service (Requires Stated Reason)"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateVoucherForService?.('Visa', v)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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

      {/* Add / Edit Visa Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingVisa ? 'Edit Visa Service' : 'Register New Visa Service'}
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Country *</label>
                  <input
                    type="text"
                    list="country-suggestions"
                    required
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. Saudi Arabia, Egypt, France"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <datalist id="country-suggestions">
                    {COMMON_COUNTRIES.map((c, i) => (
                      <option key={i} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visa Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.visa_title || ''}
                    onChange={(e) => setFormData({ ...formData, visa_title: e.target.value })}
                    placeholder="e.g. 1-Year Multiple Entry Tourist Visa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visa Type</label>
                  <select
                    value={formData.visa_type}
                    onChange={(e) => setFormData({ ...formData, visa_type: e.target.value as VisaType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white"
                  >
                    <option value="Tourist">Tourist Visa</option>
                    <option value="Business">Business Visa</option>
                    <option value="Umrah / Religious">Umrah / Religious Visa</option>
                    <option value="Transit">Transit Visa</option>
                    <option value="Work / Employment">Work / Employment</option>
                    <option value="Family / Visit">Family / Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Entry Type</label>
                  <select
                    value={formData.entry_type}
                    onChange={(e) => setFormData({ ...formData, entry_type: e.target.value as VisaEntry })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:bg-white"
                  >
                    <option value="Single Entry">Single Entry</option>
                    <option value="Multiple Entry">Multiple Entry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Validity Duration</label>
                  <input
                    type="text"
                    value={formData.validity_duration || ''}
                    onChange={(e) => setFormData({ ...formData, validity_duration: e.target.value })}
                    placeholder="e.g. 30 Days, 90 Days, 1 Year"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Processing Time</label>
                  <input
                    type="text"
                    value={formData.processing_time || ''}
                    onChange={(e) => setFormData({ ...formData, processing_time: e.target.value })}
                    placeholder="e.g. 24-48 Hours, 3-5 Business Days"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Submission Method</label>
                  <select
                    value={formData.submission_method}
                    onChange={(e) => setFormData({ ...formData, submission_method: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  >
                    <option value="Online E-Visa">Online E-Visa</option>
                    <option value="Embassy In-Person">Embassy In-Person Appointment</option>
                    <option value="Authorized Center (VFS/TLS)">Authorized Center (VFS Global / TLS Contact)</option>
                    <option value="Visa on Arrival">Visa on Arrival</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Consular Partner</label>
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
                    <option value="">Direct Embassy / Government E-Visa Portal</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category || 'Supplier'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Financial Breakdown</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Embassy / Consular Fee</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.embassy_consular_fee || 0}
                      onChange={(e) => {
                        const emb = Number(e.target.value);
                        setFormData({
                          ...formData,
                          embassy_consular_fee: emb,
                          cost_price: emb,
                          selling_price: emb + (formData.agency_fee || 0)
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Agency Service Fee</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.agency_fee || 0}
                      onChange={(e) => {
                        const ag = Number(e.target.value);
                        setFormData({
                          ...formData,
                          agency_fee: ag,
                          selling_price: (formData.cost_price || 0) + ag
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-700 mb-1">Total Selling Price *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.selling_price || 0}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="w-full bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-3 py-1.5 text-sm font-bold"
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
                      <option value="SAR">SAR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Document checklist builder */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Required Document Checklist</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {PRESET_DOCUMENT_REQUIREMENTS.map((doc, idx) => {
                    const isChecked = formData.required_documents?.includes(doc);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDocument(doc)}
                        className={`text-left text-xs p-2 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-semibold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate mr-2">{doc}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom document add */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add custom required document requirement..."
                    value={newDocInput}
                    onChange={(e) => setNewDocInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomDoc(); } }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addCustomDoc}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Applicant must bring original passport to visa center; appointment required."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
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
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingVisa ? 'Save Changes' : 'Create Visa Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Delete Visa Service</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Are you sure you want to remove this visa package from the system catalog?</p>
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
                  if (deleteConfirmId) onDeleteVisa(deleteConfirmId);
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
