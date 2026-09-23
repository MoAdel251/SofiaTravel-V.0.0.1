import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Globe, Shield, Save, Building2, CreditCard, DollarSign, CheckCircle2, AlertTriangle, RefreshCw, Zap, Check, Trash2, Percent, Ticket, Plus, X, Instagram, ExternalLink, Smartphone, Download } from 'lucide-react';
import { CompanySettings, UserRole, InstallmentPartnerConfig, InstallmentPlanRule } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
  onClearAllData?: () => Promise<void>;
  userRole?: UserRole;
}

const SETTINGS_DRAFT_KEY = 'sofia_travel_settings_draft';
const AUTO_SAVE_PREF_KEY = 'sofia_travel_settings_autosave';

export function SettingsView({ settings, onUpdateSettings, onClearAllData, userRole }: SettingsViewProps) {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    return localStorage.getItem(AUTO_SAVE_PREF_KEY) !== 'false';
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Check for unsaved draft on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(SETTINGS_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Compare with incoming settings
        const isDifferent = JSON.stringify(parsed) !== JSON.stringify(settings);
        if (isDifferent) {
          setHasUnsavedDraft(true);
        }
      }
    } catch (e) {
      console.error("Draft read error:", e);
    }
  }, [settings]);

  // Keep formData in sync when external settings change (if not dirty)
  useEffect(() => {
    if (!isDirty && !hasUnsavedDraft) {
      setFormData(settings);
    }
  }, [settings, isDirty, hasUnsavedDraft]);

  // Handle auto-save and local draft persistence when formData changes
  const handleFieldChange = (updates: Partial<CompanySettings>) => {
    const updated = { ...formData, ...updates };
    setFormData(updated);
    setIsDirty(true);

    // Save to local draft immediately
    try {
      localStorage.setItem(SETTINGS_DRAFT_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn("Could not write settings draft:", err);
    }

    // If auto-save is enabled, debounce commit to cloud
    if (autoSaveEnabled) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await onUpdateSettings(updated);
          setIsDirty(false);
          setSaved(true);
          localStorage.removeItem(SETTINGS_DRAFT_KEY);
          setHasUnsavedDraft(false);
          setTimeout(() => setSaved(false), 3000);
        } catch (err) {
          console.error("Auto-save failed:", err);
        } finally {
          setIsSaving(false);
        }
      }, 1200);
    }
  };

  const handleManualSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsSaving(true);
    onUpdateSettings(formData);
    setIsDirty(false);
    setSaved(true);
    setHasUnsavedDraft(false);
    localStorage.removeItem(SETTINGS_DRAFT_KEY);
    setIsSaving(false);
    setTimeout(() => setSaved(false), 3500);
  };

  const handleRestoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(SETTINGS_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setIsDirty(true);
        setHasUnsavedDraft(false);
      }
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(SETTINGS_DRAFT_KEY);
    setHasUnsavedDraft(false);
    setFormData(settings);
    setIsDirty(false);
  };

  const toggleAutoSave = () => {
    const next = !autoSaveEnabled;
    setAutoSaveEnabled(next);
    localStorage.setItem(AUTO_SAVE_PREF_KEY, String(next));
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Company Settings & Configuration</h1>
            <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-xs font-bold">Cloud Sync</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Configure company branding, official bank account numbers, currency abbreviations, and tax credentials.</p>
        </div>

        {/* Action Controls & Auto-save Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-Save Toggle */}
          <button
            type="button"
            onClick={toggleAutoSave}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              autoSaveEnabled 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title="When active, changes automatically persist to cloud as you type"
          >
            <Zap className={`w-3.5 h-3.5 ${autoSaveEnabled ? 'text-emerald-600 fill-emerald-600' : 'text-slate-400'}`} />
            <span>Auto-Save: {autoSaveEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Sync Status Pill */}
          {isSaving ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-700">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving to Cloud...</span>
            </div>
          ) : saved ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>All Changes Saved</span>
            </div>
          ) : isDirty ? (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-xs font-semibold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Unsaved changes in draft</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <Check className="w-3.5 h-3.5 text-slate-500" />
              <span>Synced with Firestore</span>
            </div>
          )}

          {/* Top Save Button */}
          <button
            type="button"
            onClick={() => handleManualSave()}
            disabled={isSaving}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Draft Recovery Alert */}
      {hasUnsavedDraft && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Unsaved Company Settings Draft Found</p>
              <p className="text-xs text-amber-700">We restored changes you entered previously that were not yet committed to the database.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium rounded-lg cursor-pointer"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Settings and Bank Account details updated & saved to Firestore cloud successfully!</span>
        </div>
      )}

      <form onSubmit={handleManualSave} className="space-y-6 max-w-4xl">
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
                onChange={(e) => handleFieldChange({ company_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Registration Number (TRN)</label>
              <input
                type="text"
                value={formData.tax_number || ''}
                onChange={(e) => handleFieldChange({ tax_number: e.target.value })}
                placeholder="e.g. TR-987654321-001"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange({ email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Website</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => handleFieldChange({ website: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Official Instagram Page</label>
                {formData.instagram_url && (
                  <a
                    href={formData.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-pink-600 hover:text-pink-800 font-bold flex items-center gap-1"
                  >
                    <span>Test Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.instagram_url || 'https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg=='}
                  onChange={(e) => handleFieldChange({ instagram_url: e.target.value })}
                  placeholder="https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg=="
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-pink-500 focus:bg-white font-mono text-xs text-pink-900"
                />
                <Instagram className="w-4 h-4 text-pink-600 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Link in parentheses: <span className="font-semibold text-slate-700">(https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg==)</span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Service Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleFieldChange({ phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Business Hotline</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => handleFieldChange({ whatsapp: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Office Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleFieldChange({ address: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name & Branch</label>
              <input
                type="text"
                value={formData.bank_name || ''}
                onChange={(e) => handleFieldChange({ bank_name: e.target.value })}
                placeholder="e.g. National Bank of Egypt (NBE) - Tahrir Branch"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.bank_account_number || ''}
                onChange={(e) => handleFieldChange({ bank_account_number: e.target.value })}
                placeholder="e.g. EG540003001500000010987654321"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Beneficiary Name</label>
              <input
                type="text"
                value={formData.bank_beneficiary_name || ''}
                onChange={(e) => handleFieldChange({ bank_beneficiary_name: e.target.value })}
                placeholder="e.g. Sofia Travel S.A.E."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN / SWIFT Code</label>
              <input
                type="text"
                value={formData.bank_iban_swift || ''}
                onChange={(e) => handleFieldChange({ bank_iban_swift: e.target.value })}
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
              <p className="text-xs text-slate-500">Supports Egyptian Pound (EGP), U.S. Dollar ($), Euro (€), and numbering prefixes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Base Currency</label>
              <select
                value={formData.default_currency}
                onChange={(e) => handleFieldChange({ default_currency: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Number Prefix</label>
              <input
                type="text"
                value={formData.voucher_prefix || 'VCH-2026-'}
                onChange={(e) => handleFieldChange({ voucher_prefix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-indigo-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix || 'INV-2026-'}
                onChange={(e) => handleFieldChange({ invoice_prefix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reservation Number Prefix</label>
              <input
                type="text"
                value={formData.reservation_prefix || 'RES-'}
                onChange={(e) => handleFieldChange({ reservation_prefix: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Installment Payment Agreements & Rules (ValU & TRU) */}
        <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-5 shadow-xs bg-linear-to-b from-purple-50/20 to-white">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Installment Financing Agreements (ValU & TRU)</h2>
                <p className="text-xs text-slate-500">Configure corporate agreement terms, merchant IDs, interest rates, and customer tenor plans.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(formData.installment_partners || []).map((partner, pIndex) => (
              <div key={partner.id || pIndex} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-purple-900">{partner.partner_name} Agreement</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      partner.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {partner.is_active ? 'Active in System' : 'Disabled'}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partner.is_active}
                      onChange={(e) => {
                        const updatedPartners = [...(formData.installment_partners || [])];
                        updatedPartners[pIndex] = { ...partner, is_active: e.target.checked };
                        handleFieldChange({ installment_partners: updatedPartners });
                      }}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Enable {partner.partner_name} Installments for Trips</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Agreement / Contract #</label>
                    <input
                      type="text"
                      value={partner.contract_number || ''}
                      onChange={(e) => {
                        const updated = [...(formData.installment_partners || [])];
                        updated[pIndex] = { ...partner, contract_number: e.target.value };
                        handleFieldChange({ installment_partners: updated });
                      }}
                      placeholder="e.g. VALU-SOFIA-88219"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Merchant ID</label>
                    <input
                      type="text"
                      value={partner.merchant_id || ''}
                      onChange={(e) => {
                        const updated = [...(formData.installment_partners || [])];
                        updated[pIndex] = { ...partner, merchant_id: e.target.value };
                        handleFieldChange({ installment_partners: updated });
                      }}
                      placeholder="e.g. MID-VALU-0091"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Partner Support Contact</label>
                    <input
                      type="text"
                      value={partner.support_phone || ''}
                      onChange={(e) => {
                        const updated = [...(formData.installment_partners || [])];
                        updated[pIndex] = { ...partner, support_phone: e.target.value };
                        handleFieldChange({ installment_partners: updated });
                      }}
                      placeholder="e.g. 16671"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Tenor Plans Table */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Available Tenor Plans & Terms:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {(partner.plans || []).map((plan, planIdx) => (
                      <div key={planIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center space-y-1">
                        <span className="text-xs font-bold text-purple-900 block">{plan.months} Months</span>
                        <span className="text-[10px] text-slate-500 block">Interest: {plan.interest_rate_percent}%</span>
                        <span className="text-[10px] text-slate-400 block">Admin: {plan.admin_fee_percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Agreement Terms & Policy</label>
                  <textarea
                    rows={2}
                    value={partner.agreement_terms || ''}
                    onChange={(e) => {
                      const updated = [...(formData.installment_partners || [])];
                      updated[pIndex] = { ...partner, agreement_terms: e.target.value };
                      handleFieldChange({ installment_partners: updated });
                    }}
                    placeholder="Terms of the agreement between Sofia Travel and the financing entity..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile & Desktop App Installation (PWA) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl border border-blue-500/30 p-6 text-white space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Mobile & Desktop App Installation</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                    Android & iOS
                  </span>
                </h2>
                <p className="text-xs text-slate-300">Install Sofia Travel OS directly onto any smartphone, tablet, or PC as a standalone application.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <PWAInstallButton variant="header" companyName={formData.company_name} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <p className="font-bold text-emerald-400 mb-1">📱 Android Devices</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Open in Chrome or Edge, click "Install App" or tap the 3 dots menu and select "Install app".
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <p className="font-bold text-blue-400 mb-1">🍎 Apple iOS (iPhone/iPad)</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Open in Safari, tap the Share button at the bottom, and tap "Add to Home Screen".
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <p className="font-bold text-cyan-400 mb-1">💻 Windows & Mac</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click the install icon in the URL bar to launch Sofia Travel in its own fast desktop window.
              </p>
            </div>
          </div>
        </div>

        {/* Database Maintenance & Clear Test Data */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Database Clean Slate & Production Preparation</h2>
                <p className="text-xs text-slate-500">Permanently wipe all test records, mock data, and local cache to start fresh.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center space-x-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Wipe All Test Data</span>
            </button>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">What this does:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Permanently clears all Firestore cloud collections (Trips, Hotels, Flights, Reservations, Suppliers, Customers, Invoices, Payments, Tasks, Logs).</li>
              <li>Purges browser localStorage cache so deleted data never reappears.</li>
              <li>Keeps your company branding and master settings intact.</li>
            </ul>
          </div>
          {clearedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All database collections and cache have been wiped clean! The system is ready for official work.</span>
            </div>
          )}
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            {autoSaveEnabled ? '⚡ Auto-Save is active: Changes save automatically' : 'Click save to commit changes to cloud'}
          </span>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>

      {/* Confirmation Modal for Wiping Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Clear All Database Test Data</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete all test data from the database and local cache?
              All packages, reservations, flights, hotels, invoices, and supplier records will be removed, giving you a completely empty system ready for real operations.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  if (onClearAllData) {
                    await onClearAllData();
                  }
                  setIsClearing(false);
                  setShowClearConfirm(false);
                  setClearedSuccess(true);
                  setTimeout(() => setClearedSuccess(false), 5000);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Wiping Database...</span>
                  </>
                ) : (
                  <span>Yes, Wipe All Data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

