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
} from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';

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
}: MobileQuickActionModalProps) {
  const { language, t } = useLanguage();
  if (!isOpen) return null;

  const actions = [
    {
      id: 'new-voucher',
      title: language === 'ar' ? 'إصدار سند حجز عميل' : 'New Customer Voucher',
      desc: language === 'ar' ? 'إنشاء سند رسمي لخدمة أو برنامج سياحي' : 'Issue official booking voucher for customer',
      icon: Ticket,
      color: 'bg-blue-600',
    },
    {
      id: 'new-invoice',
      title: language === 'ar' ? 'إنشاء فاتورة عميل / مورد' : 'Create Invoice / Bill',
      desc: language === 'ar' ? 'إصدار فاتورة مرتبطة بالسند والملف' : 'Generate customer or supplier invoice from voucher',
      icon: FileText,
      color: 'bg-amber-600',
    },
    {
      id: 'new-customer',
      title: language === 'ar' ? 'إضافة ملف عميل جديد' : 'Add Customer Dossier',
      desc: language === 'ar' ? 'تسجيل بيانات الجواز والهاتف ورقم الملف' : 'Register client profile, passport & sequential file #',
      icon: Users,
      color: 'bg-cyan-600',
    },
    {
      id: 'new-inquiry',
      title: language === 'ar' ? 'تسجيل استفسار عميل' : 'New Customer Inquiry',
      desc: language === 'ar' ? 'تسجيل تواصل واتساب أو إنستغرام للمتابعة' : 'Log WhatsApp or Instagram lead for follow-up',
      icon: MessageCircle,
      color: 'bg-emerald-600',
    },
    {
      id: 'new-service',
      title: language === 'ar' ? 'إضافة خدمة سياحية' : 'New Tourism Service',
      desc: language === 'ar' ? 'تأشيرة، طيران، فندق، توصيل أو رحلة بحرية' : 'Add Visa, Flight, Hotel, Cruise or Transfer',
      icon: Layers,
      color: 'bg-indigo-600',
    },
    {
      id: 'new-package',
      title: language === 'ar' ? 'إنشاء برنامج سياحي' : 'Create Tour Package',
      desc: language === 'ar' ? 'بناء برنامج متكامل متعدد الأيام' : 'Build multi-day travel itinerary package',
      icon: Compass,
      color: 'bg-rose-600',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] text-white pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'ar' ? 'إضافة سريعة' : 'Quick Create'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'حفظ مباشر في قاعدة البيانات السحابية' : 'Saves directly to Cloud Firestore'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 gap-2.5 overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  onSelectAction(act.id);
                  onClose();
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 transition-all text-start cursor-pointer active:scale-[0.99] min-h-[60px]"
              >
                <div className={`w-11 h-11 rounded-xl ${act.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-white truncate">{act.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
