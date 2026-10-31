import React, { useState } from 'react';
import { Search, X, User, CalendarDays, FileText, Truck, Hotel, Plane, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  reservations: any[];
  invoices: any[];
  hotels: any[];
  flights: any[];
  suppliers: any[];
  onNavigate: (tab: string) => void;
}

const RESULT_LIMIT = 5;

export function GlobalSearchModal({
  isOpen,
  onClose,
  customers,
  reservations,
  invoices,
  hotels,
  flights,
  suppliers,
  onNavigate,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const matches = (value: unknown) => String(value ?? '').toLowerCase().includes(q);

  const matchedCustomers = q
    ? customers.filter(c =>
        matches(c.full_name) || matches(c.name) || matches(c.customer_id) || matches(c.passport_number) ||
        matches(c.phone) || matches(c.whatsapp_number) || matches(c.email)
      ).slice(0, RESULT_LIMIT)
    : [];

  const matchedReservations = q
    ? reservations.filter(r =>
        matches(r.reservation_id) || matches(r.voucher_number) || matches(r.destination) ||
        matches(r.customer_name) || matches(r.service_title)
      ).slice(0, RESULT_LIMIT)
    : [];

  const matchedInvoices = q
    ? invoices.filter(i =>
        matches(i.invoice_number) || matches(i.customer_name) || matches(i.supplier_name) ||
        matches(i.file_number) || matches(i.id)
      ).slice(0, RESULT_LIMIT)
    : [];

  const matchedSuppliers = q
    ? suppliers.filter(s =>
        matches(s.supplier_name) || matches(s.contact_person) || matches(s.phone) || matches(s.email) || matches(s.id)
      ).slice(0, RESULT_LIMIT)
    : [];

  const matchedHotels = q
    ? hotels.filter(h =>
        matches(h.hotel_name) || matches(h.city) || matches(h.country) || matches(h.supplier_name)
      ).slice(0, RESULT_LIMIT)
    : [];

  const matchedFlights = q
    ? flights.filter(f =>
        matches(f.airline) || matches(f.booking_reference) || matches(f.passenger) ||
        matches(f.ticket_number) || matches(f.destination)
      ).slice(0, RESULT_LIMIT)
    : [];

  const totalResults =
    matchedCustomers.length + matchedReservations.length + matchedInvoices.length +
    matchedSuppliers.length + matchedHotels.length + matchedFlights.length;

  const go = (tab: string) => {
    onNavigate(tab);
    setQuery('');
    onClose();
  };

  const ResultRow = ({
    onClick,
    title,
    subtitle,
    meta,
    icon: Icon,
  }: {
    key?: React.Key;
    onClick: () => void;
    title: string;
    subtitle?: string;
    meta?: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 bg-slate-50 rounded-xl flex items-center gap-3 text-xs hover:bg-cyan-50 hover:border-cyan-200 border border-transparent transition-colors cursor-pointer group"
    >
      <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-cyan-600" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-900 truncate">{title}</span>
        {subtitle && <span className="block text-[11px] text-slate-500 truncate">{subtitle}</span>}
      </span>
      {meta && <span className="text-[11px] text-slate-500 font-mono shrink-0">{meta}</span>}
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 shrink-0" />
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search customers, invoices, vouchers, suppliers, hotels, flights..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500"
          />
          <button onClick={onClose} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {q && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {matchedCustomers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customers</h4>
                <div className="space-y-1">
                  {matchedCustomers.map(c => (
                    <ResultRow
                      key={c.id}
                      icon={User}
                      onClick={() => go('customers')}
                      title={c.full_name || c.name || 'Customer'}
                      subtitle={[c.customer_id, c.phone, c.passport_number ? `Passport: ${c.passport_number}` : ''].filter(Boolean).join(' • ')}
                    />
                  ))}
                </div>
              </div>
            )}

            {matchedInvoices.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Invoices & Bills</h4>
                <div className="space-y-1">
                  {matchedInvoices.map(inv => (
                    <ResultRow
                      key={inv.id}
                      icon={FileText}
                      onClick={() => go('invoices')}
                      title={inv.invoice_number || inv.id}
                      subtitle={`${inv.recipient_type === 'Supplier' ? inv.supplier_name || 'Supplier' : inv.customer_name || 'Customer'} • ${inv.payment_status || 'Unpaid'}`}
                      meta={inv.total_amount != null ? `${inv.total_amount} ${inv.currency || ''}` : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {matchedReservations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vouchers & Reservations</h4>
                <div className="space-y-1">
                  {matchedReservations.map(r => (
                    <ResultRow
                      key={r.id}
                      icon={CalendarDays}
                      onClick={() => go('vouchers')}
                      title={`${r.reservation_id || r.voucher_number || r.id}${r.destination ? ` — ${r.destination}` : ''}`}
                      subtitle={r.customer_name || r.service_title || 'Travel reservation'}
                      meta={r.selling_price != null ? `${r.selling_price} ${r.currency || ''}` : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {matchedSuppliers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suppliers</h4>
                <div className="space-y-1">
                  {matchedSuppliers.map(s => (
                    <ResultRow
                      key={s.id}
                      icon={Truck}
                      onClick={() => go('suppliers')}
                      title={s.supplier_name || 'Supplier'}
                      subtitle={[s.contact_person, s.phone, s.email].filter(Boolean).join(' • ')}
                    />
                  ))}
                </div>
              </div>
            )}

            {(matchedHotels.length > 0 || matchedFlights.length > 0) && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Travel Inventory</h4>
                <div className="space-y-1">
                  {matchedHotels.map(h => (
                    <ResultRow
                      key={h.id}
                      icon={Hotel}
                      onClick={() => go('hotels')}
                      title={h.hotel_name || 'Hotel'}
                      subtitle={[h.city, h.country, h.supplier_name].filter(Boolean).join(' • ')}
                    />
                  ))}
                  {matchedFlights.map(f => (
                    <ResultRow
                      key={f.id}
                      icon={Plane}
                      onClick={() => go('flights')}
                      title={`${f.airline || 'Flight'}${f.booking_reference ? ` (${f.booking_reference})` : ''}`}
                      subtitle={[f.passenger, f.destination].filter(Boolean).join(' • ')}
                    />
                  ))}
                </div>
              </div>
            )}

            {totalResults === 0 && (
              <div className="py-10 text-center text-slate-400">
                <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No matching CRM records found.</p>
                <p className="text-[11px] mt-1">Try a name, invoice number, voucher ID, passport, or phone.</p>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          Select any result to open its module. Search covers the full CRM: customers, invoices, vouchers, suppliers, hotels, and flights.
        </p>
      </div>
    </div>
  );
}
