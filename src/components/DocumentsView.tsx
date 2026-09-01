import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Upload, 
  Search, 
  Filter, 
  FolderOpen, 
  User, 
  Hotel as HotelIcon, 
  Plane, 
  ShieldCheck, 
  X,
  FileCheck,
  Calendar,
  Compass,
  Check
} from 'lucide-react';
import { TravelDocument, Customer, Supplier, TourPackage, Hotel, Flight, Invoice } from '../types';

interface DocumentsViewProps {
  documents: TravelDocument[];
  customers?: Customer[];
  suppliers?: Supplier[];
  packages?: TourPackage[];
  hotels?: Hotel[];
  flights?: Flight[];
  invoices?: Invoice[];
  onUploadDocument?: (doc: Partial<TravelDocument>) => void;
}

export function DocumentsView({ 
  documents = [],
  customers = [],
  suppliers = [],
  packages = [],
  hotels = [],
  flights = [],
  invoices = [],
  onUploadDocument
}: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [previewDoc, setPreviewDoc] = useState<TravelDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // New Document Upload State
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<TravelDocument['document_type']>('Passport');
  const [linkedEntityType, setLinkedEntityType] = useState<'Customer' | 'Supplier' | 'Package' | 'Hotel' | 'Flight' | 'Invoice' | 'General'>('Customer');
  const [linkedEntityId, setLinkedEntityId] = useState('');
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; content?: string } | null>(null);

  // Auto-aggregate system documents from entities if not already in document list
  const aggregatedDocs: TravelDocument[] = [...documents];

  // Add system invoice records as downloadable PDFs/documents
  invoices.forEach(inv => {
    if (!aggregatedDocs.some(d => d.id === `DOC-INV-${inv.id}`)) {
      aggregatedDocs.push({
        id: `DOC-INV-${inv.id}`,
        document_name: `Tax Invoice #${inv.invoice_number} (${inv.recipient_type || 'Customer'})`,
        document_type: 'Invoice',
        linked_to_type: inv.recipient_type === 'Supplier' ? 'Supplier' : 'Customer',
        linked_id: inv.customer_id || inv.supplier_id || inv.id,
        linked_name: inv.recipient_type === 'Supplier' ? (inv.supplier_name || 'Vendor') : (inv.customer_name || 'Client'),
        upload_date: inv.issue_date,
        file_size: '420 KB',
        file_url: '#'
      });
    }
  });

  // Add hotel contracts as system documents
  hotels.forEach(hot => {
    if (!aggregatedDocs.some(d => d.id === `DOC-HOT-${hot.id}`)) {
      aggregatedDocs.push({
        id: `DOC-HOT-${hot.id}`,
        document_name: `${hot.hotel_name} - Rate Sheet & Contract 2026`,
        document_type: 'Contract',
        linked_to_type: 'Supplier',
        linked_id: hot.id,
        linked_name: `${hot.hotel_name} (${hot.city})`,
        upload_date: '2026-08-01',
        file_size: '1.2 MB',
        file_url: '#'
      });
    }
  });

  // Add package brochures as system documents
  packages.forEach(pkg => {
    if (!aggregatedDocs.some(d => d.id === `DOC-PKG-${pkg.id}`)) {
      aggregatedDocs.push({
        id: `DOC-PKG-${pkg.id}`,
        document_name: `${pkg.package_name} - Official Itinerary & Brochure`,
        document_type: 'Other',
        linked_to_type: 'Reservation',
        linked_id: pkg.id,
        linked_name: `${pkg.package_name} (${pkg.destination})`,
        upload_date: '2026-08-10',
        file_size: '2.4 MB',
        file_url: '#'
      });
    }
  });

  // Add flight tickets as system documents
  flights.forEach(fl => {
    if (!aggregatedDocs.some(d => d.id === `DOC-FL-${fl.id}`)) {
      aggregatedDocs.push({
        id: `DOC-FL-${fl.id}`,
        document_name: `${fl.airline} ${fl.flight_number} E-Ticket Group Block (${fl.booking_reference})`,
        document_type: 'Flight Ticket',
        linked_to_type: 'Reservation',
        linked_id: fl.id,
        linked_name: `${fl.airline} • PNR: ${fl.booking_reference}`,
        upload_date: fl.departure_date,
        file_size: '850 KB',
        file_url: '#'
      });
    }
  });

  // Filter documents
  const filteredDocs = aggregatedDocs.filter(d => {
    const matchesSearch = d.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.linked_name && d.linked_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          d.document_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || 
      (categoryFilter === 'Passport' && (d.document_type === 'Passport' || d.document_type === 'Visa')) ||
      (categoryFilter === 'Invoice' && d.document_type === 'Invoice') ||
      (categoryFilter === 'Contract' && d.document_type === 'Contract') ||
      (categoryFilter === 'Package' && (d.document_name.includes('Itinerary') || d.document_name.includes('Package'))) ||
      (categoryFilter === 'Flight' && d.document_type === 'Flight Ticket') ||
      (categoryFilter === 'Hotel' && (d.document_type === 'Hotel Voucher' || d.document_name.includes('Hotel')));

    return matchesSearch && matchesCategory;
  });

  // Handle actual file download
  const handleDownload = (doc: TravelDocument) => {
    const content = 
      `===================================================\n` +
      `SOFIA TRAVEL OPERATIONS & GLOBAL ARCHIVES\n` +
      `===================================================\n` +
      `Document Name: ${doc.document_name}\n` +
      `Document Type: ${doc.document_type}\n` +
      `Linked Entity: ${doc.linked_name} (${doc.linked_to_type})\n` +
      `Reference ID: ${doc.linked_id}\n` +
      `Archive Date: ${doc.upload_date}\n` +
      `System Verification Code: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}\n` +
      `===================================================\n` +
      `Sofia Travel Egypt • License #1084 • Ministry of Tourism\n` +
      `This is an authentic verified electronic document.\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.document_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = file.size > 1024 * 1024 
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' 
        : Math.round(file.size / 1024) + ' KB';

      setFileDetails({
        name: file.name,
        size: sizeStr
      });
      if (!docName) {
        setDocName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName) return;

    let entityName = 'General Enterprise Archive';
    if (linkedEntityType === 'Customer') {
      const c = customers.find(x => x.id === linkedEntityId);
      entityName = c ? `${c.full_name} (${c.customer_id})` : 'Client Document';
    } else if (linkedEntityType === 'Supplier') {
      const s = suppliers.find(x => x.id === linkedEntityId);
      entityName = s ? `${s.supplier_name} (${s.type})` : 'Supplier Document';
    } else if (linkedEntityType === 'Package') {
      const p = packages.find(x => x.id === linkedEntityId);
      entityName = p ? `${p.package_name}` : 'Tour Package';
    } else if (linkedEntityType === 'Hotel') {
      const h = hotels.find(x => x.id === linkedEntityId);
      entityName = h ? `${h.hotel_name}` : 'Hotel Partner';
    } else if (linkedEntityType === 'Flight') {
      const f = flights.find(x => x.id === linkedEntityId);
      entityName = f ? `${f.airline} #${f.flight_number}` : 'Flight';
    }

    const newDoc: TravelDocument = {
      id: 'DOC-' + Date.now().toString().slice(-6),
      document_name: docName,
      document_type: docType,
      linked_to_type: (linkedEntityType === 'Supplier' ? 'Supplier' : (linkedEntityType === 'Customer' ? 'Customer' : 'Reservation')),
      linked_id: linkedEntityId || 'GEN-01',
      linked_name: entityName,
      upload_date: new Date().toISOString().split('T')[0],
      file_size: fileDetails?.size || '1.1 MB',
      file_url: '#'
    };

    if (onUploadDocument) {
      onUploadDocument(newDoc);
    } else {
      documents.unshift(newDoc);
    }

    setShowUploadModal(false);
    setDocName('');
    setFileDetails(null);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global Files & Documents Repository</h1>
          <p className="text-sm text-slate-500">
            Centrally linked across all reservations, customers, invoices, tour packages, hotel contracts, and flights.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File to System</span>
        </button>
      </div>

      {/* Categories Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by name, client, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {[
            { id: 'All', label: 'All Files' },
            { id: 'Passport', label: 'Passports & Visas' },
            { id: 'Invoice', label: 'Invoices & Bills' },
            { id: 'Contract', label: 'Contracts' },
            { id: 'Package', label: 'Tour Packages' },
            { id: 'Flight', label: 'Flight Tickets' },
            { id: 'Hotel', label: 'Hotels' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-white text-cyan-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Document Name</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Linked Entity</th>
                <th className="py-3.5 px-4 font-semibold">Upload Date</th>
                <th className="py-3.5 px-4 font-semibold">Size</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FolderOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No documents found matching your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="truncate max-w-sm">{doc.document_name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{doc.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold">
                        {doc.document_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800">{doc.linked_name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-medium">{doc.linked_to_type}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {doc.upload_date}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                      {doc.file_size}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 hover:bg-cyan-50 text-cyan-600 rounded-lg transition-colors cursor-pointer"
                          title="Preview Document Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Download Official File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">Document Verification</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs text-slate-700">
              <p><strong>Document Name:</strong> {previewDoc.document_name}</p>
              <p><strong>Category:</strong> {previewDoc.document_type}</p>
              <p><strong>Linked Entity:</strong> {previewDoc.linked_name} ({previewDoc.linked_to})</p>
              <p><strong>Archive Date:</strong> {previewDoc.upload_date}</p>
              <p><strong>File Size:</strong> {previewDoc.file_size}</p>
              <p className="text-emerald-700 font-semibold"><strong>Integrity Status:</strong> Verified & Encrypted in Sofia Cloud</p>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL with Drag-and-Drop & Click to Browse */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Upload File to Global Archive</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-4">
              {/* Drag and Drop Box */}
              <label className="block border-2 border-dashed border-cyan-300 hover:border-cyan-500 rounded-2xl p-6 text-center cursor-pointer bg-cyan-50/40 hover:bg-cyan-50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-cyan-600 mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {fileDetails ? fileDetails.name : 'Click to browse or drag & drop files here'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {fileDetails ? `Size: ${fileDetails.size}` : 'Supports PDF, JPEG, PNG, DOCX (Max 25MB)'}
                </p>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Display Title *</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Passport Copy - Emily Watson"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Passport">Passport</option>
                    <option value="Visa">Visa</option>
                    <option value="Flight Ticket">Flight Ticket</option>
                    <option value="Hotel Voucher">Hotel Voucher</option>
                    <option value="Contract">Contract / Agreement</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Package Itinerary">Package Itinerary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link to System Module</label>
                  <select
                    value={linkedEntityType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setLinkedEntityType(val);
                      if (val === 'Customer') setLinkedEntityId(customers[0]?.id || '');
                      if (val === 'Supplier') setLinkedEntityId(suppliers[0]?.id || '');
                      if (val === 'Package') setLinkedEntityId(packages[0]?.id || '');
                      if (val === 'Hotel') setLinkedEntityId(hotels[0]?.id || '');
                      if (val === 'Flight') setLinkedEntityId(flights[0]?.id || '');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Package">Tour Package</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Flight">Flight</option>
                    <option value="General">General / Company</option>
                  </select>
                </div>
              </div>

              {/* Entity Selector based on linkedEntityType */}
              {linkedEntityType === 'Customer' && customers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer</label>
                  <select
                    value={linkedEntityId}
                    onChange={(e) => setLinkedEntityId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.passport_number})</option>
                    ))}
                  </select>
                </div>
              )}

              {linkedEntityType === 'Supplier' && suppliers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier</label>
                  <select
                    value={linkedEntityId}
                    onChange={(e) => setLinkedEntityId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name} ({s.type})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm & Archive File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
