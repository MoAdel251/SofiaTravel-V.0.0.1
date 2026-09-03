import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Shield, Save, Building2, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
import { CompanySettings } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
}

export function SettingsView({ settings, onUpdateSettings }: SettingsViewProps) {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Settings & Configuration</h1>
          <p className="text-sm text-slate-500">Configure company branding, official bank account numbers, currency abbreviations, and tax credentials.</p>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Settings and Bank Account details updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Company Profile & Contact Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-cyan-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Company Profile & Contact Information</h2>
              <p className="text-xs text-slate-500">Appears on invoices, vouchers, receipts, and customer statements.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Trade Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Registration Number (TRN)</label>
              <input
                type="text"
                value={formData.tax_number || ''}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="e.g. TR-987654321-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Website</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Service Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Business Hotline</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Banking & Settlement Details (Appears Consistently on Invoices) */}
        <div className="bg-white rounded-2xl border border-cyan-200/80 p-6 space-y-5 shadow-xs bg-linear-to-b from-cyan-50/20 to-white">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-cyan-700" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Official Company Bank Account</h2>
              <p className="text-xs text-slate-500">Bank name and account number appear consistently on all customer and supplier invoices for wire transfers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name & Branch *</label>
              <input
                type="text"
                required
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g. National Bank of Egypt (NBE) - Tahrir Branch"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number *</label>
              <input
                type="text"
                required
                value={formData.bank_account_number || ''}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                placeholder="e.g. EG540003001500000010987654321"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary Name</label>
              <input
                type="text"
                value={formData.bank_beneficiary_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_beneficiary_name: e.target.value })}
                placeholder="e.g. Sofia Travel S.A.E."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN / SWIFT Code</label>
              <input
                type="text"
                value={formData.bank_iban_swift || ''}
                onChange={(e) => setFormData({ ...formData, bank_iban_swift: e.target.value })}
                placeholder="e.g. SWIFT: NBEGEGCX054"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Currency & Document Prefixes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Supported Currencies & System Formats</h2>
              <p className="text-xs text-slate-500">Supports Egyptian Pound (EGP), U.S. Dollar ($), and Euro (€).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Base Currency</label>
              <select
                value={formData.default_currency}
                onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              >
                <option value="USD">U.S. Dollar ($)</option>
                <option value="EGP">Egyptian Pound (EGP)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="SAR">Saudi Riyal (SAR)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix || 'INV-2026-'}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reservation Number Prefix</label>
              <input
                type="text"
                value={formData.reservation_prefix || 'RES-'}
                onChange={(e) => setFormData({ ...formData, reservation_prefix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}

