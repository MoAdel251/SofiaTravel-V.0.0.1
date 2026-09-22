import React, { useState } from 'react';
import { ShieldAlert, X, Send, Lock, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { UserRole } from '../types';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'Edit' | 'Delete';
  moduleName: string;
  itemId: string;
  itemName: string;
  proposedChanges?: any;
  currentUsername: string;
  userRole: UserRole;
  onSubmitRequest: (reason: string, proposedChanges?: any) => Promise<void> | void;
}

export function PermissionModal({
  isOpen,
  onClose,
  actionType,
  moduleName,
  itemId,
  itemName,
  proposedChanges,
  currentUsername,
  userRole,
  onSubmitRequest
}: PermissionModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmitRequest(reason, proposedChanges);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setReason('');
        setIsSubmitting(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Error submitting request:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          actionType === 'Delete' ? 'bg-gradient-to-r from-rose-700 to-red-800' : 'bg-gradient-to-r from-amber-600 to-orange-700'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Manager Approval Required</h3>
              <p className="text-xs text-white/80">Submit request to Edit/Delete content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Request Submitted Successfully</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your request to <span className="font-semibold">{actionType.toLowerCase()}</span> "{itemName}" has been sent to Administrators and Managers for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Employee:</span>
                <span className="font-bold text-slate-800">{currentUsername} ({userRole})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target Module:</span>
                <span className="font-bold text-blue-700 px-2 py-0.5 bg-blue-50 rounded-md">{moduleName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target Item:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{itemName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Requested Action:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  actionType === 'Delete' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {actionType} Record
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Administrator Approval Required</p>
                <p className="text-amber-700 leading-normal">
                  Permissions to edit or delete records are granted on a <strong>one-time basis</strong> upon approval by an Administrator. Please state a clear, specific reason below for review.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason for {actionType} Request <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State why this record needs to be edited or deleted..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Permission Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
