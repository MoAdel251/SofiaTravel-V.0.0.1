export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // App & Brand
  app_title: { en: 'Sofia Travel', ar: 'صوفيا للسياحة' },
  app_subtitle: { en: 'Travel Management System', ar: 'نظام إدارة الشركات السياحية' },
  search_placeholder: { en: 'Search (Name, File #, PNR, Invoice...)', ar: 'بحث (اسم العميل، رقم الملف، الحجز، الفاتورة...)' },
  cloud_live: { en: 'Cloud DB Connected', ar: 'متصل بقاعدة البيانات' },
  cloud_connecting: { en: 'Connecting DB...', ar: 'جاري الاتصال...' },
  cloud_offline: { en: 'Offline Cache', ar: 'وضع عدم الاتصال' },

  // Language Switcher
  language: { en: 'Language', ar: 'اللغة' },
  english: { en: 'English', ar: 'الإنجليزية' },
  arabic: { en: 'العربية', ar: 'العربية' },
  switch_to_arabic: { en: 'العربية (AR)', ar: 'العربية' },
  switch_to_english: { en: 'English (EN)', ar: 'English' },

  // Navigation Tabs & Mobile Bottom Bar
  nav_dashboard: { en: 'Dashboard', ar: 'الرئيسية' },
  nav_vouchers: { en: 'Customer Vouchers', ar: 'سندات العملاء' },
  nav_vouchers_short: { en: 'Vouchers', ar: 'السندات' },
  nav_services: { en: 'Tourism Services', ar: 'الخدمات السياحية' },
  nav_approval_requests: { en: 'Approval Requests', ar: 'طلبات الموافقة' },
  nav_customers: { en: 'Customers', ar: 'العملاء' },
  nav_customer_inquiries: { en: 'Customer Inquiries', ar: 'استفسارات العملاء' },
  nav_inquiries_short: { en: 'Inquiries', ar: 'الاستفسارات' },
  nav_suppliers: { en: 'Suppliers', ar: 'الموردين' },
  nav_invoices: { en: 'Invoices & Billing', ar: 'الفواتير والحسابات' },
  nav_invoices_short: { en: 'Invoices', ar: 'الفواتير' },
  nav_packages: { en: 'Tour Packages', ar: 'البرامج السياحية' },
  nav_employees: { en: 'Employees', ar: 'الموظفين' },
  nav_calendar: { en: 'Calendar', ar: 'التقويم' },
  nav_tasks: { en: 'Tasks', ar: 'المهام' },
  nav_attendance: { en: 'Attendance', ar: 'الحضور والانصراف' },
  nav_targets: { en: 'Employee Targets', ar: 'أهداف الموظفين' },
  nav_documents: { en: 'Documents', ar: 'المستندات' },
  nav_reports: { en: 'Reports', ar: 'التقارير' },
  nav_finance_payroll: { en: 'Finance & Payroll', ar: 'المالية والرواتب' },
  nav_notifications: { en: 'Notifications', ar: 'الإشعارات' },
  nav_settings: { en: 'Settings', ar: 'الإعدادات' },
  nav_audit_log: { en: 'Audit Log', ar: 'سجل العمليات' },
  nav_menu: { en: 'Menu', ar: 'القائمة' },
  nav_quick_add: { en: 'New', ar: 'إضافة' },
  all_modules: { en: 'All System Modules', ar: 'جميع أقسام النظام' },
  display_currency: { en: 'Display Currency', ar: 'عملة العرض' },
  active_account: { en: 'Active Account', ar: 'الحساب النشط' },
  sign_out: { en: 'Sign Out', ar: 'تسجيل الخروج' },

  // Admin Delete All Data / Factory Reset
  admin_delete_all_btn: { en: 'Delete All Data', ar: 'حذف جميع البيانات' },
  admin_reset_title: { en: 'Delete All Existing Data (Republish Clean)', ar: 'حذف جميع البيانات الحالية (تهيئة الموقع للنشر من جديد)' },
  admin_reset_subtitle: { en: 'Administrator-only action to permanently clear all records and republish from scratch.', ar: 'صلاحية حصرية للمدير العام لحذف كافة السجلات نهائياً وتجهيز الموقع للنشر من الصفر.' },
  admin_reset_modal_title: { en: 'Confirm Permanent Deletion of All Data', ar: 'تأكيد الحذف النهائي لجميع البيانات' },
  admin_reset_warning: { en: 'This will permanently delete all customers, inquiries, vouchers, reservations, invoices, suppliers, packages, hotels, flights, tourism services, payments, expenses, tasks, documents, notifications, and logs from the cloud database and local storage.', ar: 'سيؤدي هذا الإجراء إلى الحذف النهائي لجميع العملاء، الاستفسارات، السندات، الحجوزات، الفواتير، الموردين، البرامج، الفنادق، الطيران، الخدمات السياحية، المدفوعات، المصروفات، المهام، والسجلات من قاعدة البيانات السحابية والتخزين المحلي.' },
  admin_reset_keep_employees_label: { en: 'Also delete non-administrator employee accounts (recommended for clean republishing)', ar: 'حذف حسابات الموظفين التجريبية أيضاً (مع الاحتفاظ بحساب المدير العام فقط)' },
  admin_reset_confirm_check: { en: 'I confirm that I am the Administrator and want to erase all existing data permanently.', ar: 'أؤكد أنني المدير العام وأرغب في مسح جميع البيانات الحالية نهائياً للبدء من جديد.' },
  admin_reset_execute_btn: { en: 'Delete All Data Permanently', ar: 'حذف جميع البيانات نهائياً' },
  admin_reset_in_progress: { en: 'Deleting all cloud & local records...', ar: 'جاري مسح جميع البيانات السحابية والمحلية...' },
  admin_reset_success: { en: 'All existing data has been permanently deleted! The platform is now completely clean and ready to republish.', ar: 'تم حذف جميع البيانات بنجاح! الموقع الآن فارغ تماماً وجاهز للنشر والعمل من جديد.' },
  db_status_title: { en: 'Cloud Database Connection (Firestore)', ar: 'اتصال قاعدة البيانات السحابية (Firestore)' },
  db_verify_btn: { en: 'Verify & Sync Database', ar: 'فحص ومزامنة قاعدة البيانات' },

  // Common Actions
  add: { en: 'Add', ar: 'إضافة' },
  edit: { en: 'Edit', ar: 'تعديل' },
  delete: { en: 'Delete', ar: 'حذف' },
  save: { en: 'Save', ar: 'حفظ' },
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  search: { en: 'Search', ar: 'بحث' },
  filter: { en: 'Filter', ar: 'تصفية' },
  print: { en: 'Print', ar: 'طباعة' },
  export_csv: { en: 'Export CSV', ar: 'تصدير CSV' },
  download_pdf: { en: 'Download PDF', ar: 'تحميل PDF' },
  send_whatsapp: { en: 'Send via WhatsApp', ar: 'إرسال عبر واتساب' },
  actions: { en: 'Actions', ar: 'الإجراءات' },
  status: { en: 'Status', ar: 'الحالة' },
  date: { en: 'Date', ar: 'التاريخ' },
  details: { en: 'Details', ar: 'التفاصيل' },
  close: { en: 'Close', ar: 'إغلاق' },
  confirm: { en: 'Confirm', ar: 'تأكيد' },
  view: { en: 'View', ar: 'عرض' },

  // Dashboard Stats
  total_sales: { en: 'Total Sales Volume', ar: 'إجمالي حجم المبيعات' },
  net_profit: { en: 'Net Profit Margin', ar: 'صافي أرباح الشركة' },
  total_customers: { en: 'Registered Clients', ar: 'إجمالي العملاء المسجلين' },
  active_reservations: { en: 'Active Bookings', ar: 'الحجوزات والرحلات النشطة' },
  outstanding_balance: { en: 'Outstanding Balances', ar: 'المبالغ المستحقة' },
  receivables: { en: 'Customer Receivables', ar: 'مستحقات العملاء' },
  payables: { en: 'Supplier Payables', ar: 'التزامات الموردين' },

  // Customers & Dossiers
  customer_management: { en: 'Customer Management & Master Files', ar: 'إدارة العملاء والملفات الرئيسية' },
  customer_files_dossiers: { en: 'Customer Files & Master Dossiers', ar: 'ملفات العملاء والملفات المتسلسلة' },
  profiles_table: { en: 'Customer Profiles List', ar: 'جدول العملاء' },
  file_number: { en: 'File #', ar: 'رقم الملف' },
  customer_id: { en: 'Customer Code', ar: 'كود العميل' },
  passport_number: { en: 'Passport Number', ar: 'رقم الجواز' },
  nationality: { en: 'Nationality', ar: 'الجنسية' },
  customer_type: { en: 'Client Type', ar: 'نوع العميل' },
  phone: { en: 'Phone Number', ar: 'رقم الهاتف' },
  email: { en: 'Email Address', ar: 'البريد الإلكتروني' },
  open_dossier: { en: 'Open Dossier File', ar: 'فتح ملف العميل' },
  statement_3_curr: { en: '3-Currency Statement', ar: 'كشف حساب بـ 3 عملات' },
  customer_vouchers: { en: '1. Created Vouchers & Services', ar: '1. السندات والخدمات المنشأة' },
  customer_invoices_sales: { en: '2. Customer Sales Invoices', ar: '2. فواتير مبيعات العميل' },
  customer_supplier_bills: { en: '3. Supplier Liability Bills', ar: '3. فواتير التزامات الموردين' },

  // Invoices & Billing
  invoices_hub: { en: 'Invoices & Billing Hub', ar: 'مركز الفواتير والحسابات' },
  create_new_invoice: { en: 'Create New Invoice / Bill', ar: 'إنشاء فاتورة جديدة' },
  customer_invoice: { en: 'Customer Sales Invoice', ar: 'فاتورة مبيعات عميل' },
  supplier_invoice: { en: 'Supplier Liability Bill', ar: 'فاتورة التزام مورد' },
  recipient_type: { en: 'Invoice Category', ar: 'تصنيف الفاتورة' },
  invoice_number: { en: 'Invoice Number', ar: 'رقم الفاتورة' },
  issue_date: { en: 'Issue Date', ar: 'تاريخ الإصدار' },
  due_date: { en: 'Due Date', ar: 'تاريخ الاستحقاق' },
  currency: { en: 'Currency', ar: 'العملة' },
  total_amount: { en: 'Total Amount', ar: 'الإجمالي' },
  paid_amount: { en: 'Amount Paid', ar: 'المبلغ المدفوع' },
  balance_due: { en: 'Balance Due', ar: 'المبلغ المتبقي' },
  payment_status: { en: 'Payment Status', ar: 'حالة الدفع' },
  associated_customer: { en: 'Associated Customer Name', ar: 'اسم العميل المرتبط' },
  associated_supplier: { en: 'Supplier Partner Name', ar: 'اسم المورد المرتبط' },
  net_price: { en: 'Net Cost Price', ar: 'السعر الصافي (التكلفة)' },
  selling_price: { en: 'Selling Price', ar: 'سعر البيع' },
  select_voucher_net: { en: 'Choose Voucher (Net Price)', ar: 'اختر السند (بالسعر الصافي)' },
  select_voucher_sell: { en: 'Choose Voucher (Selling Price)', ar: 'اختر السند (بسعر البيع)' },

  // Services
  service_flight: { en: 'Flight Tickets', ar: 'تذاكر الطيران' },
  service_hotel: { en: 'Hotel Lodging', ar: 'حجوزات الفنادق' },
  service_visa: { en: 'Visas & E-Visas', ar: 'التأشيرات' },
  service_transfer: { en: 'Transfers & Fleet', ar: 'التوصيلات والنقل' },
  service_cruise: { en: 'Nile & Sea Cruises', ar: 'الرحلات البحرية والنيلية' },
  service_tour: { en: 'Guided Tours', ar: 'الجولات السياحية' },
  service_day_trip: { en: 'Day Trips & Safaris', ar: 'رحلات اليوم الواحد والسياري' },
  service_package: { en: 'Travel Package', ar: 'برنامج سياحي كامل' },

  // Statuses
  paid: { en: 'Paid', ar: 'مدفوع بالكامل' },
  partially_paid: { en: 'Partially Paid', ar: 'مدفوع جزئياً' },
  unpaid: { en: 'Unpaid / Outstanding', ar: 'غير مدفوع' },
  pending: { en: 'Pending', ar: 'قيد الانتظار' },
  confirmed: { en: 'Confirmed', ar: 'مؤكد' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },

  // Currencies
  curr_usd: { en: 'US Dollar ($)', ar: 'دولار أمريكي ($)' },
  curr_egp: { en: 'Egyptian Pound (EGP)', ar: 'جنيه مصري (EGP)' },
  curr_eur: { en: 'Euro (€)', ar: 'يورو (€)' },

  // Form Labels
  full_name: { en: 'Full Name', ar: 'الاسم بالكامل' },
  gender: { en: 'Gender', ar: 'الجنس' },
  male: { en: 'Male', ar: 'ذكر' },
  female: { en: 'Female', ar: 'أنثى' },
  notes: { en: 'Notes & Terms', ar: 'ملاحظات وشروط' },
  travel_date: { en: 'Travel Date', ar: 'تاريخ السفر' },
  return_date: { en: 'Return Date', ar: 'تاريخ العودة' },
  number_of_travelers: { en: 'Travelers Count', ar: 'عدد المسافرين' },
  destination: { en: 'Destination / City', ar: 'الوجهة / المدينة' }
};

export function getTranslation(key: string, lang: Language): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  if (translations[key] && translations[key].en) {
    return translations[key].en;
  }
  return key;
}
