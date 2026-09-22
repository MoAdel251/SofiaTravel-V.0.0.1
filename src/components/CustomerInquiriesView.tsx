import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MessageCircle, 
  Phone, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Send, 
  RefreshCw, 
  Eye, 
  AlertCircle,
  ExternalLink,
  Instagram,
  ChevronDown,
  X,
  Sparkles,
  ShieldAlert,
  Compass,
  FileText
} from 'lucide-react';
import { CustomerInquiry, InquiryFollowUp, InquirySource, InquiryStatus, Employee, Customer } from '../types';

interface CustomerInquiriesViewProps {
  inquiries: CustomerInquiry[];
  employees: Employee[];
  customers: Customer[];
  userRole: string;
  userPermissions?: string[];
  currentUser?: string;
  onSaveInquiry: (inquiry: Partial<CustomerInquiry>) => Promise<void>;
  onDeleteInquiry: (id: string, name: string) => Promise<void>;
  onLogFollowUp: (inquiryId: string, followUp: { representative_name: string; channel: string; outcome: string; notes: string; next_followup_date?: string; new_status?: InquiryStatus }) => Promise<void>;
  onConvertToCustomer: (inquiry: CustomerInquiry) => Promise<void>;
  onRequestApproval?: (action: 'Edit' | 'Delete', item: any, module: string) => void;
}

export function CustomerInquiriesView({
  inquiries = [],
  employees = [],
  customers = [],
  userRole,
  userPermissions = [],
  currentUser = 'Staff Member',
  onSaveInquiry,
  onDeleteInquiry,
  onLogFollowUp,
  onConvertToCustomer,
  onRequestApproval
}: CustomerInquiriesViewProps) {
  const isAdmin = userRole === 'Administrator';
  const canEdit = isAdmin || userPermissions.includes('edit_customers') || userPermissions.includes('manage_customers');
  const canDelete = isAdmin || userPermissions.includes('delete_customers') || userPermissions.includes('manage_customers');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'All' | InquirySource>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | InquiryStatus>('All');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
  const [repFilter, setRepFilter] = useState<string>('All');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<CustomerInquiry | null>(null);
  const [viewingInquiry, setViewingInquiry] = useState<CustomerInquiry | null>(null);
  const [followUpModalInquiry, setFollowUpModalInquiry] = useState<CustomerInquiry | null>(null);
  const [convertModalInquiry, setConvertModalInquiry] = useState<CustomerInquiry | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<Partial<CustomerInquiry>>({
    name: '',
    gender: 'Male',
    phone: '',
    email: '',
    inquiry_source: 'WhatsApp',
    social_handle: '',
    inquired_service: '',
    destination: '',
    travel_date: '',
    estimated_travelers: 1,
    budget: '',
    assigned_representative: currentUser,
    status: 'New Inquiry',
    priority: 'Medium',
    next_followup_date: '',
    notes: ''
  });

  // Follow-up interaction form
  const [followUpForm, setFollowUpForm] = useState({
    representative_name: currentUser,
    channel: 'WhatsApp',
    outcome: 'Client interested, requested detailed itinerary & quotation',
    notes: '',
    next_followup_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    new_status: 'Under Follow-up' as InquiryStatus
  });

  // Convert to customer form state
  const [convertForm, setConvertForm] = useState({
    passport_number: '',
    nationality: 'Egyptian',
    date_of_birth: '',
    address: ''
  });

  const [saving, setSaving] = useState(false);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingInquiry(null);
    setFormData({
      name: '',
      gender: 'Male',
      phone: '',
      email: '',
      inquiry_source: 'WhatsApp',
      social_handle: '',
      inquired_service: '',
      destination: '',
      travel_date: '',
      estimated_travelers: 1,
      budget: '',
      assigned_representative: currentUser,
      status: 'New Inquiry',
      priority: 'Medium',
      next_followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (inq: CustomerInquiry) => {
    if (!isAdmin && onRequestApproval) {
      onRequestApproval('Edit', inq, 'Customer Inquiries');
      return;
    }
    setEditingInquiry(inq);
    setFormData({ ...inq });
    setIsModalOpen(true);
  };

  // Handle delete inquiry
  const handleDeleteClick = (inq: CustomerInquiry) => {
    if (!isAdmin && onRequestApproval) {
      onRequestApproval('Delete', inq, 'Customer Inquiries');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the inquiry from "${inq.name}"?`)) {
      onDeleteInquiry(inq.id, inq.name);
    }
  };

  // Handle submit inquiry create / update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      alert('Please enter both the customer name and contact phone number.');
      return;
    }
    setSaving(true);
    try {
      await onSaveInquiry(editingInquiry ? { ...formData, id: editingInquiry.id } : formData);
      setIsModalOpen(false);
      setEditingInquiry(null);
    } catch (err: any) {
      alert('Error saving inquiry: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Handle log follow-up
  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpModalInquiry) return;
    setSaving(true);
    try {
      await onLogFollowUp(followUpModalInquiry.id, followUpForm);
      setFollowUpModalInquiry(null);
    } catch (err: any) {
      alert('Error saving follow-up: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Handle convert inquiry to client
  const handleConfirmConvert = async () => {
    if (!convertModalInquiry) return;
    setSaving(true);
    try {
      await onConvertToCustomer({
        ...convertModalInquiry,
        ...convertForm
      } as any);
      setConvertModalInquiry(null);
    } catch (err: any) {
      alert('Error converting inquiry to customer: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Relative freshness label for Last Updated
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // WhatsApp click handler
  const handleOpenWhatsApp = (phone: string, name: string, service?: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hello ${name}, thank you for reaching out to Sofia Travel regarding ${service || 'our tourism services'}. How may we assist you today?`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inq => {
      // Search
      const searchMatch = !searchTerm || 
        inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.phone.includes(searchTerm) ||
        (inq.inquiry_code && inq.inquiry_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inq.inquired_service && inq.inquired_service.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inq.social_handle && inq.social_handle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inq.destination && inq.destination.toLowerCase().includes(searchTerm.toLowerCase()));

      // Source
      const sourceMatch = sourceFilter === 'All' || inq.inquiry_source === sourceFilter;

      // Status
      const statusMatch = statusFilter === 'All' || inq.status === statusFilter;

      // Gender
      const genderMatch = genderFilter === 'All' || inq.gender === genderFilter;

      // Representative
      const repMatch = repFilter === 'All' || inq.assigned_representative === repFilter;

      return searchMatch && sourceMatch && statusMatch && genderMatch && repMatch;
    });
  }, [inquiries, searchTerm, sourceFilter, statusFilter, genderFilter, repFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const instagramCount = inquiries.filter(i => i.inquiry_source === 'Instagram').length;
    const whatsAppCount = inquiries.filter(i => i.inquiry_source === 'WhatsApp').length;
    const activeFollowups = inquiries.filter(i => i.status === 'New Inquiry' || i.status === 'Under Follow-up' || i.status === 'Price Quoted' || i.status === 'Awaiting Response').length;
    const convertedCount = inquiries.filter(i => i.status === 'Converted to Customer').length;

    return { total, instagramCount, whatsAppCount, activeFollowups, convertedCount };
  }, [inquiries]);

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-200">
              <MessageCircle className="w-3.5 h-3.5" />
              Pre-Booking Inquiries & Leads
            </span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-200">
              Instagram & WhatsApp Pipeline
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            Customer Inquiries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-3xl leading-relaxed">
            Record and follow up with potential customers who have inquired via Instagram or WhatsApp but haven’t yet engaged or completed a booking. Staff can review inquiries, reassign follow-ups, log interactions, and convert leads into registered clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <a
            href="https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg=="
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Visit Company Instagram Page (https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg==)"
          >
            <Instagram className="w-4 h-4" />
            <span>Sofia Travel Instagram</span>
            <span className="text-[10px] text-pink-100/90 font-normal hidden lg:inline">
              (https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg==)
            </span>
          </a>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Inquiry</span>
          </button>
        </div>
      </div>

      {/* Distinction Explanatory Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="p-2 bg-emerald-100/80 rounded-xl text-emerald-800 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">
            Dedicated Inquiries System vs. Acquired Customers Directory
          </p>
          <p className="text-slate-600 leading-normal">
            The <strong className="text-slate-800 font-semibold">Customers</strong> page is reserved exclusively for clients Sofia Travel has already acquired and booked with. This <strong className="text-emerald-800 font-semibold">Customer Inquiries</strong> page enables any team member to pick up, track, and follow up with active leads inquiring on social channels. When they are ready to book, convert them directly with one click.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Inquiries</span>
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All recorded social prospects</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">WhatsApp Leads</span>
            <span className="w-4 h-4 flex items-center justify-center font-black text-xs bg-emerald-100 text-emerald-700 rounded-full">W</span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{stats.whatsAppCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Direct chat conversations</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Instagram DMs</span>
            <span className="w-4 h-4 flex items-center justify-center font-black text-xs bg-rose-100 text-rose-700 rounded-full">IG</span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{stats.instagramCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Instagram direct message inquiries</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Follow-up</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{stats.activeFollowups}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting staff outreach or response</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Converted Clients</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{stats.convertedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Completed booking & added to CRM</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, trip, or handle..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Channel / Source Filter */}
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Channels</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Website">Website</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Statuses</option>
              <option value="New Inquiry">New Inquiry</option>
              <option value="Under Follow-up">Under Follow-up</option>
              <option value="Price Quoted">Price Quoted</option>
              <option value="Awaiting Response">Awaiting Response</option>
              <option value="Not Interested / Postponed">Not Interested / Postponed</option>
              <option value="Converted to Customer">Converted to Customer</option>
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Assigned Representative Filter */}
            <select
              value={repFilter}
              onChange={e => setRepFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="All">All Staff / Reps</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.name || emp.full_name}>{emp.name || emp.full_name}</option>
              ))}
            </select>

            {(searchTerm || sourceFilter !== 'All' || statusFilter !== 'All' || genderFilter !== 'All' || repFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSourceFilter('All');
                  setStatusFilter('All');
                  setGenderFilter('All');
                  setRepFilter('All');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-extrabold">
                <th className="py-3 px-4">Inquiry Code & Channel</th>
                <th className="py-3 px-4">Customer Name & Gender</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Inquired Trip / Service</th>
                <th className="py-3 px-4">Assigned Rep</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated Date</th>
                <th className="py-3 px-4 text-right">Actions & Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <MessageCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-600">No customer inquiries found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || sourceFilter !== 'All' || statusFilter !== 'All'
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Record inquiring individuals from Instagram and WhatsApp to start follow-up tracking.'}
                    </p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Record First Inquiry
                    </button>
                  </td>
                </tr>
              ) : (
                filteredInquiries.map(inq => {
                  return (
                    <tr key={inq.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code & Channel */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{inq.inquiry_code}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {inq.inquiry_source === 'WhatsApp' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              WhatsApp
                            </span>
                          )}
                          {inq.inquiry_source === 'Instagram' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Instagram
                            </span>
                          )}
                          {inq.inquiry_source !== 'WhatsApp' && inq.inquiry_source !== 'Instagram' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold">
                              {inq.inquiry_source}
                            </span>
                          )}
                          {inq.social_handle && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={inq.social_handle}>
                              {inq.social_handle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Gender */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>{inq.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                            inq.gender === 'Female' 
                              ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {inq.gender}
                          </span>
                        </div>
                        {inq.email && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{inq.email}</div>
                        )}
                      </td>

                      {/* Phone with WhatsApp Quick Action */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">{inq.phone}</span>
                          <button
                            onClick={() => handleOpenWhatsApp(inq.phone, inq.name, inq.inquired_service)}
                            title="Direct WhatsApp Message"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>Direct Contact</span>
                        </div>
                      </td>

                      {/* Inquired Trip / Service */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-800 truncate" title={inq.inquired_service}>
                          {inq.inquired_service}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          {inq.destination && <span>📍 {inq.destination}</span>}
                          {inq.travel_date && <span>📅 {inq.travel_date}</span>}
                        </div>
                      </td>

                      {/* Assigned Representative */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {inq.assigned_representative ? inq.assigned_representative.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <span className="truncate max-w-[120px]">{inq.assigned_representative || 'Unassigned'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {inq.follow_up_history && inq.follow_up_history.length > 0 
                            ? `${inq.follow_up_history.length} touchpoint(s)` 
                            : 'No touches yet'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                          inq.status === 'New Inquiry' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          inq.status === 'Under Follow-up' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          inq.status === 'Price Quoted' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          inq.status === 'Awaiting Response' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                          inq.status === 'Converted to Customer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {inq.status}
                        </span>
                        {inq.next_followup_date && inq.status !== 'Converted to Customer' && (
                          <div className="text-[10px] text-amber-600 mt-1 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Next: {inq.next_followup_date}
                          </div>
                        )}
                      </td>

                      {/* Last Updated Date (MANDATORY REQUIREMENT) */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {getRelativeTime(inq.last_updated)}
                        </div>
                        <div className="text-[10px] text-slate-400" title={inq.last_updated}>
                          {formatDate(inq.last_updated)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Log Follow-up Button */}
                          <button
                            onClick={() => {
                              setFollowUpModalInquiry(inq);
                              setFollowUpForm({
                                representative_name: currentUser,
                                channel: inq.inquiry_source === 'Instagram' ? 'Instagram' : 'WhatsApp',
                                outcome: 'Followed up with quotation and travel options',
                                notes: '',
                                next_followup_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                                new_status: 'Under Follow-up'
                              });
                            }}
                            title="Log Follow-up Touchpoint"
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 transition-colors flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Follow Up</span>
                          </button>

                          {/* Convert to Client Button (if not already converted) */}
                          {inq.status !== 'Converted to Customer' ? (
                            <button
                              onClick={() => {
                                setConvertModalInquiry(inq);
                                setConvertForm({
                                  passport_number: '',
                                  nationality: 'Egyptian',
                                  date_of_birth: '',
                                  address: ''
                                });
                              }}
                              title="Convert to Acquired Customer"
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Convert</span>
                            </button>
                          ) : (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Converted
                            </span>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => setViewingInquiry(inq)}
                            title="View Full Profile & History"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(inq)}
                            title={isAdmin ? "Edit Details" : "Request Edit Approval"}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClick(inq)}
                            title={isAdmin ? "Delete Record" : "Request Delete Approval"}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT INQUIRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingInquiry ? 'Edit Customer Inquiry' : 'Record New Customer Inquiry'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Capture contact details of prospects inquiring via Instagram or WhatsApp before booking.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Youssef Mansour"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Gender *
                  </label>
                  <select
                    value={formData.gender || 'Male'}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +20 100 123 4567"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Channel / Inquiry Source */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Inquiry Channel *
                  </label>
                  <select
                    value={formData.inquiry_source || 'WhatsApp'}
                    onChange={e => setFormData({ ...formData, inquiry_source: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Instagram">Instagram Direct Message (DM)</option>
                    <option value="Facebook">Facebook Messenger</option>
                    <option value="Website">Website Contact Form</option>
                    <option value="Phone Call">Incoming Phone Call</option>
                    <option value="Walk-in">Walk-in Visit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Social Handle */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Social Handle / Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @youssef_travels or WhatsApp ID"
                    value={formData.social_handle || ''}
                    onChange={e => setFormData({ ...formData, social_handle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Inquired Service / Trip */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Inquired Trip / Service *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5-Day Sharm El Sheikh Resort Package or Nile Cruise Luxor-Aswan"
                    value={formData.inquired_service || ''}
                    onChange={e => setFormData({ ...formData, inquired_service: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hurghada, Luxor, Dubai, Istanbul"
                    value={formData.destination || ''}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Preferred Travel Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Target Travel Date
                  </label>
                  <input
                    type="date"
                    value={formData.travel_date || ''}
                    onChange={e => setFormData({ ...formData, travel_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Estimated Travelers */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimated_travelers || 1}
                    onChange={e => setFormData({ ...formData, estimated_travelers: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Budget / Price Expectation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $800 - $1200 or ~25,000 EGP"
                    value={formData.budget || ''}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Assigned Representative */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Assigned Representative *
                  </label>
                  <select
                    value={formData.assigned_representative || ''}
                    onChange={e => setFormData({ ...formData, assigned_representative: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="">-- Select Staff Member --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name || emp.full_name}>
                        {emp.name || emp.full_name} ({emp.position || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Inquiry Status
                  </label>
                  <select
                    value={formData.status || 'New Inquiry'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="New Inquiry">New Inquiry</option>
                    <option value="Under Follow-up">Under Follow-up</option>
                    <option value="Price Quoted">Price Quoted</option>
                    <option value="Awaiting Response">Awaiting Response</option>
                    <option value="Not Interested / Postponed">Not Interested / Postponed</option>
                    <option value="Converted to Customer">Converted to Customer</option>
                  </select>
                </div>

                {/* Scheduled Next Follow-up Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Next Follow-up Reminder
                  </label>
                  <input
                    type="date"
                    value={formData.next_followup_date || ''}
                    onChange={e => setFormData({ ...formData, next_followup_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority || 'Medium'}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="High">High (Hot Lead)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Customer Requirements & Questions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specific requests, hotel preferences, questions asked during Instagram/WhatsApp chat..."
                    value={formData.notes || ''}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingInquiry ? 'Update Inquiry' : 'Save & Track Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG FOLLOW-UP MODAL */}
      {followUpModalInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Log Follow-up Touchpoint
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customer: <strong className="text-slate-800">{followUpModalInquiry.name}</strong> ({followUpModalInquiry.phone})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setFollowUpModalInquiry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFollowUp} className="mt-4 space-y-4">
              {/* Quick WhatsApp greeting shortcut */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-bold text-emerald-900">Need to message them right now?</span>
                  <p className="text-[11px] text-emerald-700">Open WhatsApp with customer details prefilled.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(followUpModalInquiry.phone, followUpModalInquiry.name, followUpModalInquiry.inquired_service)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Chat Now
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Representative Logging Follow-up
                  </label>
                  <select
                    value={followUpForm.representative_name}
                    onChange={e => setFollowUpForm({ ...followUpForm, representative_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name || emp.full_name}>{emp.name || emp.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Contact Channel
                  </label>
                  <select
                    value={followUpForm.channel}
                    onChange={e => setFollowUpForm({ ...followUpForm, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Instagram">Instagram Direct Message</option>
                    <option value="Phone">Phone Call</option>
                    <option value="Email">Email</option>
                    <option value="In-Person">In-Person Office Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Interaction Outcome / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sent hotel quote; client comparing with family"
                  value={followUpForm.outcome}
                  onChange={e => setFollowUpForm({ ...followUpForm, outcome: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Detailed Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes from customer, objections, special dates..."
                  value={followUpForm.notes}
                  onChange={e => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Update Pipeline Status
                  </label>
                  <select
                    value={followUpForm.new_status}
                    onChange={e => setFollowUpForm({ ...followUpForm, new_status: e.target.value as InquiryStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="Under Follow-up">Under Follow-up</option>
                    <option value="Price Quoted">Price Quoted</option>
                    <option value="Awaiting Response">Awaiting Response</option>
                    <option value="Not Interested / Postponed">Not Interested / Postponed</option>
                    <option value="Converted to Customer">Converted to Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpForm.next_followup_date}
                    onChange={e => setFollowUpForm({ ...followUpForm, next_followup_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFollowUpModalInquiry(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Record Touchpoint & Update Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONVERT TO CUSTOMER MODAL */}
      {convertModalInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Convert Inquiry to Acquired Client
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transfer lead to official CRM Customer Directory.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setConvertModalInquiry(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <p className="font-bold text-blue-900">
                  Ready to book {convertModalInquiry.name}?
                </p>
                <p className="text-blue-700">
                  This will register a new profile in the <strong className="text-blue-950 font-bold">Customers</strong> database with their contact number (<span className="font-mono">{convertModalInquiry.phone}</span>) and mark this inquiry as converted.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Passport Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A12345678"
                    value={convertForm.passport_number}
                    onChange={e => setConvertForm({ ...convertForm, passport_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Egyptian"
                    value={convertForm.nationality}
                    onChange={e => setConvertForm({ ...convertForm, nationality: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={convertForm.date_of_birth}
                    onChange={e => setConvertForm({ ...convertForm, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    City / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cairo, Egypt"
                    value={convertForm.address}
                    onChange={e => setConvertForm({ ...convertForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertModalInquiry(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvert}
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Converting...' : 'Confirm & Add to Customers'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FULL DETAILS & HISTORY MODAL */}
      {viewingInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-xs font-bold">
                    {viewingInquiry.inquiry_code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-black ${
                    viewingInquiry.inquiry_source === 'WhatsApp' ? 'bg-emerald-100 text-emerald-800' :
                    viewingInquiry.inquiry_source === 'Instagram' ? 'bg-rose-100 text-rose-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {viewingInquiry.inquiry_source}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {viewingInquiry.name}
                </h3>
              </div>
              <button 
                onClick={() => setViewingInquiry(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              {/* Primary Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Gender</span>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingInquiry.gender}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                  <div className="font-bold text-slate-800 mt-0.5 font-mono">{viewingInquiry.phone}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Social Handle</span>
                  <div className="font-bold text-slate-800 mt-0.5">{viewingInquiry.social_handle || '—'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Last Updated</span>
                  <div className="font-bold text-emerald-700 mt-0.5">{formatDate(viewingInquiry.last_updated)}</div>
                </div>
              </div>

              {/* Inquired Service Details */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Inquired Trip / Service</span>
                  <span className="text-xs font-bold text-emerald-700">{viewingInquiry.status}</span>
                </div>
                <div className="text-sm font-black text-slate-900">{viewingInquiry.inquired_service}</div>
                <div className="flex flex-wrap gap-4 text-slate-600 text-xs pt-1">
                  {viewingInquiry.destination && <span>📍 Destination: <strong>{viewingInquiry.destination}</strong></span>}
                  {viewingInquiry.travel_date && <span>📅 Target Date: <strong>{viewingInquiry.travel_date}</strong></span>}
                  {viewingInquiry.estimated_travelers && <span>👥 Travelers: <strong>{viewingInquiry.estimated_travelers}</strong></span>}
                  {viewingInquiry.budget && <span>💰 Budget: <strong>{viewingInquiry.budget}</strong></span>}
                </div>
              </div>

              {/* Notes */}
              {viewingInquiry.notes && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Customer Requirements & Notes</span>
                  <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viewingInquiry.notes}
                  </div>
                </div>
              )}

              {/* Follow-up Touchpoints History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">
                    Follow-up Touchpoints & History ({viewingInquiry.follow_up_history?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      setViewingInquiry(null);
                      setFollowUpModalInquiry(viewingInquiry);
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Touchpoint
                  </button>
                </div>

                {(!viewingInquiry.follow_up_history || viewingInquiry.follow_up_history.length === 0) ? (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                    No follow-up touchpoints logged yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {viewingInquiry.follow_up_history.map(touch => (
                      <div key={touch.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span className="font-bold text-slate-700">{touch.representative_name} ({touch.channel})</span>
                          <span>{formatDate(touch.date)}</span>
                        </div>
                        <div className="font-bold text-slate-900">{touch.outcome}</div>
                        {touch.notes && <p className="text-slate-600 text-[11px]">{touch.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {!canEdit || !isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        const inq = viewingInquiry;
                        setViewingInquiry(null);
                        onRequestApproval?.('Edit', inq, 'Customer Inquiries');
                      }}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Request Admin Approval to Edit Inquiry"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Request Edit Permission</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const inq = viewingInquiry;
                        setViewingInquiry(null);
                        handleOpenEditModal(inq);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Inquiry</span>
                    </button>
                  )}

                  {!canDelete || !isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        const inq = viewingInquiry;
                        setViewingInquiry(null);
                        onRequestApproval?.('Delete', inq, 'Customer Inquiries');
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Request Admin Approval to Delete Inquiry"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Request Delete Permission</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const inq = viewingInquiry;
                        setViewingInquiry(null);
                        handleDeleteClick(inq);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Inquiry</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenWhatsApp(viewingInquiry.phone, viewingInquiry.name, viewingInquiry.inquired_service)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Chat on WhatsApp
                  </button>
                  <button
                    onClick={() => setViewingInquiry(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
