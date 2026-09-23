import React from 'react';
import { 
  X, 
  Ticket, 
  MessageCircle, 
  Layers, 
  Users, 
  FileText, 
  Plus, 
  Compass, 
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';
import { UserRole } from '../types';

interface MobileQuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
  userRole?: UserRole;
}

export function MobileQuickActionModal({
  isOpen,
  onClose,
  onSelectAction,
  userRole
}: MobileQuickActionModalProps) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'new-voucher',
      title: 'New Customer Voucher',
      desc: 'Issue official booking voucher for customer',
      icon: Ticket,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Sales & Ops'
    },
    {
      id: 'new-inquiry',
      title: 'New Customer Inquiry',
      desc: 'Log lead, destination, budget & contact info',
      icon: MessageCircle,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Leads'
    },
    {
      id: 'new-service',
      title: 'New Tourism Service',
      desc: 'Add Visa, Flight, Hotel, Cruise or Transfer',
      icon: Layers,
      color: 'from-purple-600 to-violet-600',
      badge: 'Services'
    },
    {
      id: 'new-customer',
      title: 'Add Customer Profile',
      desc: 'Register passport details & phone',
      icon: Users,
      color: 'from-cyan-600 to-blue-600',
      badge: 'CRM'
    },
    {
      id: 'new-invoice',
      title: 'Create Client Invoice',
      desc: 'Generate commercial invoice with payment tracking',
      icon: FileText,
      color: 'from-amber-600 to-orange-600',
      badge: 'Finance'
    },
    {
      id: 'new-package',
      title: 'Create Tour Package',
      desc: 'Build multi-day itinerary package',
      icon: Compass,
      color: 'from-rose-600 to-pink-600',
      badge: 'Tours'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Quick Add Record</h3>
              <p className="text-[11px] text-slate-300">Tap to create and save directly into database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all text-left cursor-pointer group active:scale-98"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-white truncate">{act.title}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-300 font-semibold shrink-0">
                      {act.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
