import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Megaphone, Plus, X, RefreshCw, AlertCircle, CheckCheck, Paperclip,
  Users, Building2, UserCheck, Eye, FileText, Send,
} from 'lucide-react';
import type { Announcement, AnnouncementPriority, Employee, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime, hrFetch, readFileAsDataUrl, type ActingContext } from '../services/hrApi';

interface AnnouncementsViewProps {
  employees: Employee[];
  currentEmployee?: Employee | null;
  currentUsername: string;
  userRole: UserRole;
  isAdmin: boolean;
  isITAccount: boolean;
  onShowToast?: (message: string) => void;
}

interface ReadStatusRow {
  employee_id: string;
  employee_name: string;
  department: string;
  read_at: string | null;
  has_read: boolean;
}

interface ReadStatus {
  announcement_id: string;
  total_audience: number;
  read_count: number;
  unread_count: number;
  readers: ReadStatusRow[];
  non_readers: ReadStatusRow[];
}

const PRIORITY_STYLES: Record<AnnouncementPriority, string> = {
  Normal: 'bg-slate-100 text-slate-600 border-slate-200',
  Important: 'bg-amber-100 text-amber-700 border-amber-200',
  Urgent: 'bg-rose-100 text-rose-700 border-rose-200',
};

const EMPTY_ANNOUNCEMENT = {
  title: '',
  description: '',
  publish_date: new Date().toISOString().slice(0, 10),
  expires_at: '',
  priority: 'Normal' as AnnouncementPriority,
  audience_type: 'ALL' as Announcement['audience_type'],
  target_departments: [] as string[],
  target_groups: [] as string[],
  target_employee_ids: [] as string[],
  attachment_name: '',
  attachment_data: '',
};

export function AnnouncementsView({
  employees,
  currentEmployee,
  currentUsername,
  userRole,
  isAdmin,
  isITAccount,
  onShowToast,
}: AnnouncementsViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const L = (en: string, ar: string) => (isAr ? ar : en);

  const acting: ActingContext = useMemo(
    () => ({ username: currentUsername, role: isAdmin ? 'Administrator' : userRole, isIT: isITAccount }),
    [currentUsername, userRole, isAdmin, isITAccount]
  );

  const canManage = isAdmin || isITAccount ||
    (Array.isArray(currentEmployee?.permissions) && currentEmployee!.permissions!.includes('manage_announcements'));

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_ANNOUNCEMENT });
  const [formError, setFormError] = useState('');
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [readStatus, setReadStatus] = useState<ReadStatus | null>(null);
  const [readStatusLoading, setReadStatusLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await hrFetch<Announcement[]>('/api/announcements', acting);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || L('Unable to load announcements.', 'تعذر تحميل الإعلانات.'));
    } finally {
      setLoading(false);
    }
  }, [acting, isAr]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(emp => {
      const dept = String(emp.department || '').trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [employees]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp: any) => {
      if (emp.group) set.add(String(emp.group));
      if (emp.employee_group) set.add(String(emp.employee_group));
      if (Array.isArray(emp.groups)) emp.groups.forEach((g: any) => g && set.add(String(g)));
    });
    return Array.from(set).sort();
  }, [employees]);

  const visibleAnnouncements = useMemo(() => {
    const term = search.trim().toLowerCase();
    return announcements
      .filter(a => (showArchived ? a.status === 'Archived' : a.status !== 'Archived'))
      .filter(a => !term || [a.title, a.description, a.created_by_name]
        .some(value => String(value || '').toLowerCase().includes(term)));
  }, [announcements, showArchived, search]);

  const unreadCount = announcements.filter(a => a.status !== 'Archived' && !a.is_read).length;

  const markRead = async (announcement: Announcement) => {
    if (announcement.is_read) return;
    try {
      await hrFetch(`/api/announcements/${encodeURIComponent(announcement.id)}/read`, acting, { method: 'POST', body: {} });
      setAnnouncements(prev => prev.map(a => a.id === announcement.id
        ? { ...a, is_read: true, read_at: new Date().toISOString() }
        : a));
    } catch (err: any) {
      onShowToast?.(err?.message || L('Unable to mark the announcement as read.', 'تعذر تعليم الإعلان كمقروء.'));
    }
  };

  const openAnnouncement = async (announcement: Announcement) => {
    setSelected(announcement);
    if (!announcement.is_read) {
      await markRead(announcement);
      setSelected(prev => prev && prev.id === announcement.id ? { ...prev, is_read: true } : prev);
    }
  };

  const openComposer = () => {
    setForm({
      ...EMPTY_ANNOUNCEMENT,
      publish_date: new Date().toISOString().slice(0, 10),
    });
    setFormError('');
    setShowComposer(true);
  };

  const handleAttachment = async (file: File | null) => {
    if (!file) {
      setForm(prev => ({ ...prev, attachment_name: '', attachment_data: '' }));
      return;
    }
    if (file.size > 500 * 1024) {
      setFormError(L('Attachment must be smaller than 500 KB.', 'يجب أن يكون المرفق أصغر من 500 كيلوبايت.'));
      return;
    }
    const data = await readFileAsDataUrl(file);
    setForm(prev => ({ ...prev, attachment_name: file.name, attachment_data: data }));
  };

  const toggleListValue = (key: 'target_departments' | 'target_groups' | 'target_employee_ids', value: string) => {
    setForm(prev => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const submitAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (form.title.trim().length < 3) {
      setFormError(L('Please enter a title.', 'يرجى إدخال عنوان.'));
      return;
    }
    if (form.description.trim().length < 3) {
      setFormError(L('Please enter the announcement details.', 'يرجى إدخال تفاصيل الإعلان.'));
      return;
    }
    if (form.audience_type === 'DEPARTMENTS' && form.target_departments.length === 0) {
      setFormError(L('Select at least one department.', 'اختر قسماً واحداً على الأقل.'));
      return;
    }
    if (form.audience_type === 'EMPLOYEES' && form.target_employee_ids.length === 0) {
      setFormError(L('Select at least one employee.', 'اختر موظفاً واحداً على الأقل.'));
      return;
    }
    if (form.audience_type === 'GROUPS' && form.target_groups.length === 0) {
      setFormError(L('Select at least one group.', 'اختر مجموعة واحدة على الأقل.'));
      return;
    }

    setSaving(true);
    try {
      await hrFetch('/api/announcements', acting, {
        method: 'POST',
        body: {
          ...form,
          title: form.title.trim(),
          description: form.description.trim(),
          expires_at: form.expires_at || undefined,
          attachment_name: form.attachment_name || undefined,
          attachment_data: form.attachment_data || undefined,
        },
      });
      setShowComposer(false);
      onShowToast?.(L('Announcement published.', 'تم نشر الإعلان.'));
      await loadAnnouncements();
    } catch (err: any) {
      setFormError(err?.message || L('Unable to publish the announcement.', 'تعذر نشر الإعلان.'));
    } finally {
      setSaving(false);
    }
  };

  const archiveAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm(L('Archive this announcement?', 'هل تريد أرشفة هذا الإعلان؟'))) return;
    setSaving(true);
    try {
      await hrFetch(`/api/announcements/${encodeURIComponent(announcement.id)}`, acting, {
        method: 'PUT',
        body: { status: announcement.status === 'Archived' ? 'Published' : 'Archived' },
      });
      onShowToast?.(L('Announcement updated.', 'تم تحديث الإعلان.'));
      setSelected(null);
      await loadAnnouncements();
    } catch (err: any) {
      onShowToast?.(err?.message || L('Unable to update the announcement.', 'تعذر تحديث الإعلان.'));
    } finally {
      setSaving(false);
    }
  };

  const openReadStatus = async (announcement: Announcement) => {
    setReadStatusLoading(true);
    setReadStatus(null);
    setSelected(announcement);
    try {
      const data = await hrFetch<ReadStatus>(`/api/announcements/${encodeURIComponent(announcement.id)}/read-status`, acting);
      setReadStatus(data);
    } catch (err: any) {
      onShowToast?.(err?.message || L('Unable to load the read report.', 'تعذر تحميل تقرير القراءة.'));
    } finally {
      setReadStatusLoading(false);
    }
  };

  const audienceLabel = (announcement: Announcement) => {
    if (announcement.audience_type === 'ALL') return L('All employees', 'جميع الموظفين');
    if (announcement.audience_type === 'DEPARTMENTS') {
      return `${L('Departments', 'الأقسام')}: ${(announcement.target_departments || []).join(', ')}`;
    }
    if (announcement.audience_type === 'GROUPS') {
      return `${L('Groups', 'المجموعات')}: ${(announcement.target_groups || []).join(', ')}`;
    }
    return `${L('Selected employees', 'موظفون محددون')} (${(announcement.target_employee_ids || []).length})`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-600 rounded-xl text-white shadow-md shadow-cyan-600/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {L('Internal Announcements', 'الإعلانات الداخلية')}
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount} {L('new', 'جديد')}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {L(
              'Company-wide updates, HR notices and important alerts with read confirmation.',
              'تحديثات الشركة وإشعارات الموارد البشرية والتنبيهات المهمة مع تأكيد القراءة.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadAnnouncements()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {L('Refresh', 'تحديث')}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={openComposer}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {L('New Announcement', 'إعلان جديد')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={L('Search announcements…', 'بحث في الإعلانات…')}
          className="w-full sm:max-w-sm px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${!showArchived ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {L('Published', 'المنشورة')}
          </button>
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${showArchived ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {L('Archived', 'المؤرشفة')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleAnnouncements.map(announcement => {
          const isUnread = !announcement.is_read;
          return (
            <button
              key={announcement.id}
              type="button"
              onClick={() => void openAnnouncement(announcement)}
              className={`text-start bg-white rounded-2xl border p-4 hover:shadow-md transition-all relative ${
                isUnread ? 'border-cyan-300 ring-1 ring-cyan-100' : 'border-slate-200'
              }`}
            >
              {isUnread && <span className="absolute top-3 end-3 w-2.5 h-2.5 rounded-full bg-cyan-500" />}
              <div className="flex flex-wrap items-center gap-2 pe-4">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_STYLES[announcement.priority]}`}>
                  {announcement.priority}
                </span>
                {announcement.status === 'Archived' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold">
                    {L('Archived', 'مؤرشف')}
                  </span>
                )}
                {announcement.expires_at && (
                  <span className="text-[10px] text-slate-400">
                    {L('Expires', 'ينتهي')}: {String(announcement.expires_at).slice(0, 10)}
                  </span>
                )}
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-2">{announcement.title}</div>
              <div className="text-xs text-slate-600 mt-1.5 line-clamp-3 whitespace-pre-line">{announcement.description}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 mt-3">
                <span>{formatDateTime(announcement.publish_date)}</span>
                <span>{audienceLabel(announcement)}</span>
                {typeof announcement.read_count === 'number' && (
                  <span>{announcement.read_count}/{announcement.audience_count || 0} {L('read', 'قرأوا')}</span>
                )}
                {announcement.attachment_name && <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" />{announcement.attachment_name}</span>}
              </div>
            </button>
          );
        })}
        {visibleAnnouncements.length === 0 && !loading && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
            {showArchived ? L('No archived announcements.', 'لا توجد إعلانات مؤرشفة.') : L('No announcements yet.', 'لا توجد إعلانات بعد.')}
          </div>
        )}
        {loading && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
            {L('Loading announcements…', 'جاري تحميل الإعلانات…')}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${PRIORITY_STYLES[selected.priority]}`}>
                    {selected.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDateTime(selected.publish_date)}</span>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 mt-1.5">{selected.title}</h2>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selected.created_by_name ? `${L('Published by', 'نشر بواسطة')}: ${selected.created_by_name}` : ''}
                  {selected.expires_at ? ` · ${L('Expires', 'ينتهي')}: ${String(selected.expires_at).slice(0, 10)}` : ''}
                </div>
              </div>
              <button type="button" onClick={() => { setSelected(null); setReadStatus(null); }} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{selected.description}</div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-500">
                <div><span className="font-bold text-slate-600">{L('Audience', 'الجمهور')}:</span> {audienceLabel(selected)}</div>
                {selected.is_read ? (
                  <div className="mt-1 inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCheck className="w-3.5 h-3.5" /> {L('Marked as read', 'تم التعليم كمقروء')}
                  </div>
                ) : (
                  <button type="button" onClick={() => void markRead(selected)} className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-[11px] font-bold">
                    <CheckCheck className="w-3.5 h-3.5" /> {L('Mark as Read', 'تعليم كمقروء')}
                  </button>
                )}
              </div>
              {selected.attachment_name && selected.attachment_data && (
                <a
                  href={selected.attachment_data}
                  download={selected.attachment_name}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:underline"
                >
                  <Paperclip className="w-4 h-4" /> {selected.attachment_name}
                </a>
              )}

              {canManage && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void openReadStatus(selected)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> {L('Read report', 'تقرير القراءة')}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void archiveAnnouncement(selected)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {selected.status === 'Archived' ? L('Unarchive', 'إلغاء الأرشفة') : L('Archive', 'أرشفة')}
                    </button>
                  </div>

                  {readStatusLoading && (
                    <div className="mt-3 text-[11px] text-slate-400 inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {L('Loading read report…', 'جاري تحميل تقرير القراءة…')}
                    </div>
                  )}
                  {readStatus && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[11px] font-bold text-slate-600">
                        {readStatus.read_count}/{readStatus.total_audience} {L('employees read this announcement', 'موظفاً قرأ هذا الإعلان')}
                        <span className="text-rose-500"> · {readStatus.unread_count} {L('not read', 'لم يقرأوا')}</span>
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100">
                        {readStatus.readers.map(row => (
                          <div key={row.employee_id || row.employee_name} className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-50 last:border-0 text-[11px]">
                            <span className="font-semibold text-slate-700">{row.employee_name}</span>
                            <span className={row.has_read ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                              {row.has_read ? formatDateTime(row.read_at) : L('Not read', 'لم يقرأ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showComposer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={submitAnnouncement} className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-600" />
                <h2 className="text-sm font-extrabold text-slate-900">{L('Publish announcement', 'نشر إعلان')}</h2>
              </div>
              <button type="button" onClick={() => setShowComposer(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Title', 'العنوان')}</label>
                <input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Details', 'التفاصيل')}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Publish date', 'تاريخ النشر')}</label>
                  <input
                    type="date"
                    value={form.publish_date}
                    onChange={e => setForm(prev => ({ ...prev, publish_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Expiry date (optional)', 'تاريخ الانتهاء (اختياري)')}</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Priority', 'الأولوية')}</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    {['Normal', 'Important', 'Urgent'].map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Audience', 'الجمهور')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ALL', label: L('All', 'الجميع'), icon: Users },
                    { id: 'DEPARTMENTS', label: L('Departments', 'الأقسام'), icon: Building2 },
                    { id: 'GROUPS', label: L('Groups', 'المجموعات'), icon: Users },
                    { id: 'EMPLOYEES', label: L('Employees', 'الموظفون'), icon: UserCheck },
                  ].map(option => {
                    const Icon = option.icon;
                    const active = form.audience_type === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, audience_type: option.id as Announcement['audience_type'] }))}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-[11px] font-bold ${
                          active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.audience_type === 'DEPARTMENTS' && (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-100 bg-slate-50">
                  {departments.map(dept => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleListValue('target_departments', dept)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        form.target_departments.includes(dept)
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                  {departments.length === 0 && <span className="text-[11px] text-slate-400">{L('No departments found.', 'لا توجد أقسام.')}</span>}
                </div>
              )}

              {form.audience_type === 'GROUPS' && (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl border border-slate-100 bg-slate-50">
                  {groups.map(group => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => toggleListValue('target_groups', group)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        form.target_groups.includes(group)
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                  {groups.length === 0 && (
                    <span className="text-[11px] text-slate-400">
                      {L('No employee groups are defined yet.', 'لا توجد مجموعات موظفين بعد.')}
                    </span>
                  )}
                </div>
              )}

              {form.audience_type === 'EMPLOYEES' && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.target_employee_ids.includes(emp.id)}
                        onChange={() => toggleListValue('target_employee_ids', emp.id)}
                      />
                      {emp.name}
                      <span className="text-slate-400 font-normal">{emp.department}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {L('Attachment (optional, max 500 KB)', 'مرفق (اختياري، 500 كيلوبايت كحد أقصى)')}
                </label>
                <input
                  type="file"
                  onChange={e => void handleAttachment(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:me-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:text-[11px] file:font-bold"
                />
                {form.attachment_name && <div className="text-[10px] text-slate-400 mt-1 truncate">{form.attachment_name}</div>}
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                  {formError}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowComposer(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                {L('Cancel', 'إلغاء')}
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold disabled:opacity-50">
                {saving ? L('Publishing…', 'جاري النشر…') : L('Publish', 'نشر')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsView;
