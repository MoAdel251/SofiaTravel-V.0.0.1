export type UserRole = 'Administrator' | 'Manager' | 'Sales' | 'Accountant' | 'Operations' | 'Customer Service';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export type CustomerType = 'Individual' | 'Family' | 'Corporate' | 'Travel Agent' | 'Partner';

export interface Customer {
  id: string;
  customer_id: string;
  full_name: string;
  name?: string; // alias
  passport_number: string;
  nationality: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  whatsapp_number: string;
  email: string;
  address: string;
  notes: string;
  customer_type: CustomerType;
  registration_date: string;
  outstanding_balance: number;
  currency: string;
}

export type ServiceType = 
  | 'Flight' 
  | 'Hotel' 
  | 'Tour' 
  | 'Transfer' 
  | 'Visa' 
  | 'Cruise' 
  | 'Day Trip'
  | 'Transportation' 
  | 'Travel Package' 
  | 'Other';

export type VoucherStatus = 
  | 'Draft' 
  | 'Sent' 
  | 'Confirmed' 
  | 'Converted to Trip/Service' 
  | 'Completed' 
  | 'Cancelled';

export type ReservationStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Paid' 
  | 'Partially Paid' 
  | 'Cancelled' 
  | 'Completed';

export type InstallmentPartnerConfig = InstallmentPartnerAgreement;
export type InstallmentPlanRule = InstallmentPlanOption;

export interface InstallmentPlanOption {
  months: number;
  interest_rate_percent: number; // 0% for promos, or interest rate
  admin_fee_percent: number; // e.g. 3%, 5%
  down_payment_percent: number; // e.g. 0%, 10%
  merchant_fee_percent: number; // merchant discount rate
  label?: string;
}

export interface InstallmentPartnerAgreement {
  id: string;
  partner_name: 'ValU' | 'TRU' | string;
  is_active: boolean;
  merchant_id: string;
  contract_number: string;
  support_phone?: string;
  settlement_cycle?: string; // e.g. "T+2 Business Days via Bank Transfer"
  settlement_account?: string;
  min_amount?: number;
  max_amount?: number;
  customer_admin_fee_rule?: string;
  terms_and_conditions?: string;
  agreement_terms?: string;
  support_contact?: string;
  plans: InstallmentPlanOption[];
}

export interface InstallmentDetails {
  partner?: 'ValU' | 'TRU' | string;
  partner_name?: string;
  contract_number?: string;
  plan_months: number;
  monthly_amount?: number;
  monthly_installment_amount?: number;
  down_payment?: number;
  down_payment_amount?: number;
  admin_fee?: number;
  admin_fee_amount?: number;
  interest_rate_percent?: number;
  total_interest_amount?: number;
  financed_amount?: number;
  total_payable_by_customer?: number;
  total_customer_cost?: number;
  merchant_commission_deducted?: number;
  merchant_settlement_amount?: number;
  customer_phone_registered?: string;
  approval_code?: string;
  approval_status?: string;
  transaction_reference?: string;
  status?: 'Pending Approval' | 'Approved' | 'Settled' | 'Cancelled' | string;
}

export interface Voucher {
  id: string;
  voucher_number: string;
  reservation_id?: string; // mapped reservation
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_passport?: string;
  service_category: 'Tour Package' | 'Visa' | 'Transfer' | 'Cruise' | 'Tour' | 'Day Trip' | 'Flight' | 'Hotel' | 'Custom';
  service_reference_id?: string;
  service_title: string;
  destination: string;
  issue_date: string;
  valid_until: string;
  travel_date: string;
  return_date?: string;
  number_of_travelers: number;
  adults_count?: number;
  children_count?: number;
  infants_count?: number;
  supplier_id?: string;
  supplier_name?: string;
  employee_id: string;
  employee_name?: string;
  selling_price: number;
  cost_price: number;
  paid_amount: number;
  remaining_amount: number;
  profit: number;
  currency: string;
  payment_method?: string; // Cash, Bank Transfer, Credit Card, InstaPay, ValU (Installments), TRU (Installments)
  payment_status?: string;
  installment_details?: InstallmentDetails | null;
  status: VoucherStatus;
  reservation_status?: ReservationStatus;
  sent_to_customer_at?: string;
  sent_via?: 'WhatsApp' | 'Email' | 'Direct Print' | 'SMS';
  confirmed_at?: string;
  converted_at?: string;
  converted_trip_title?: string;
  itinerary_or_details?: string;
  inclusions?: string[];
  exclusions?: string[];
  terms_conditions?: string;
  notes?: string;
  customer_invoice_id?: string;
  customer_invoice_number?: string;
  supplier_invoice_id?: string;
  supplier_invoice_number?: string;
}

export interface Reservation extends Voucher {
  // Alias for backward compatibility
  service_type: ServiceType;
  booking_date: string;
  payment_status: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded';
  reservation_status: ReservationStatus;
}

// Tourism-Related Services
export type VisaType = 'Tourist' | 'Business' | 'Transit' | 'Work / Employment' | 'Family / Visit' | 'Umrah / Religious';
export type VisaEntry = 'Single Entry' | 'Multiple Entry';

export interface VisaService {
  id: string;
  country: string;
  visa_title: string;
  visa_type: VisaType;
  entry_type: VisaEntry;
  validity_duration: string;
  processing_time: string;
  supplier_id?: string;
  supplier_name?: string;
  embassy_consular_fee: number;
  agency_fee: number;
  cost_price: number;
  selling_price: number;
  currency: string;
  required_documents: string[];
  submission_method: 'Online E-Visa' | 'Embassy In-Person' | 'Visa on Arrival' | 'Authorized Center (VFS/TLS)';
  notes?: string;
  status: 'Active' | 'Suspended';
}

export type VehicleType = 'Sedan / Limousine (1-3 Pax)' | 'SUV / Minivan (1-6 Pax)' | 'HiAce Van (1-14 Pax)' | 'Coaster Minibus (1-24 Pax)' | 'Coach Bus (1-50 Pax)';

export interface TransferService {
  id: string;
  service_title: string;
  vehicle_type: VehicleType;
  pickup_location: string;
  dropoff_location: string;
  transfer_type: 'Airport Pickup' | 'Airport Dropoff' | 'Intercity Transfer' | 'City Tour By Hours' | 'Port Transfer';
  max_passengers: number;
  max_luggage: number;
  distance_km?: number;
  estimated_duration?: string;
  supplier_id?: string;
  supplier_name?: string;
  driver_name?: string;
  driver_phone?: string;
  cost_price: number;
  selling_price: number;
  currency: string;
  meet_and_greet: boolean;
  includes_tolls: boolean;
  amenities: string[];
  notes?: string;
  status: 'Active' | 'Inactive';
}

export type CruiseCategory = 'Nile Cruise (Luxor - Aswan)' | 'Lake Nasser Cruise' | 'Red Sea Yacht Charter' | 'Dahabiya Luxury Sail' | 'Mediterranean Sea Cruise' | string;
export type CruiseCabinType = 'Standard Cabin' | 'Deluxe Nile View' | 'Junior Suite' | 'Presidential Suite' | 'Royal Suite' | string;
export type BoardBasis = 'Full Board' | 'All Inclusive' | 'Half Board' | 'Bed & Breakfast' | string;
export type DayTripCategory = 'Desert Safari & Camping' | 'Historical & Archeological' | 'Snorkeling & Diving' | 'City Sightseeing' | 'Adventure & Water Sports' | string;
export type TourStyle = TourType | string;

export interface CruiseService {
  id: string;
  cruise_name: string;
  cruise_category: CruiseCategory;
  ship_rating?: '5-Star Deluxe' | '5-Star Standard' | 'Ultra Luxury Boutique' | '4-Star Standard' | string;
  route?: string;
  route_itinerary?: string;
  embarkation_port?: string;
  disembarkation_port?: string;
  duration_nights: number;
  cabin_type?: CruiseCabinType;
  board_basis?: BoardBasis;
  departure_schedule?: string;
  supplier_id?: string;
  supplier_name?: string;
  cost_price: number;
  selling_price: number;
  currency: string;
  highlights?: string[];
  inclusions?: string[];
  sightseeing_included?: boolean;
  guide_included?: boolean;
  notes?: string;
  status: 'Active' | 'Seasonal' | 'Sold Out';
}

export type TourType = 'Cultural & Historical' | 'Desert Safari & Camping' | 'Religious & Heritage' | 'Adventure & Trekking' | 'Eco & Nature' | 'Classic Roundtrip';

export interface TourService {
  id: string;
  tour_title: string;
  tour_type?: TourType;
  tour_style?: TourStyle;
  destination?: string;
  destination_cities?: string[];
  duration_days: number;
  guide_languages?: string[];
  transport_mode?: string;
  supplier_id?: string;
  supplier_name?: string;
  cost_price: number;
  selling_price: number;
  currency: string;
  included_meals?: string;
  entrance_tickets_included?: boolean;
  min_travelers?: number;
  max_travelers?: number;
  itinerary_summary?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  notes?: string;
  status: 'Active' | 'Seasonal' | 'Draft';
}

export interface DayTripService {
  id: string;
  trip_title: string;
  category?: DayTripCategory;
  location_city?: string;
  city_location?: string;
  duration_hours: number;
  departure_time?: string;
  pickup_included?: boolean;
  supplier_id?: string;
  supplier_name?: string;
  cost_price: number;
  selling_price: number;
  currency: string;
  includes_lunch?: boolean;
  includes_entry_tickets?: boolean;
  guide_included?: boolean;
  highlights?: string[];
  inclusions?: string[];
  schedule_description?: string;
  notes?: string;
  status: 'Active' | 'Inactive';
}

export type PackageStatus = 'Draft' | 'Available' | 'Fully Booked' | 'Closed' | 'Cancelled';

export interface TourPackage {
  id: string;
  package_name: string;
  title?: string; // alias
  destination: string;
  duration: string;
  start_date: string;
  end_date: string;
  hotel: string;
  transportation: string;
  activities: string;
  meals: string;
  available_seats: number;
  cost: number;
  cost_price?: number; // alias
  selling_price: number;
  currency?: string;
  profit_margin: number;
  included_services: string[];
  included?: string[]; // alias
  excluded_services: string[];
  excluded?: string[]; // alias
  itinerary?: string;
  terms_conditions: string;
  images: string[];
  status: PackageStatus;
}

export interface Hotel {
  id: string;
  hotel_name: string;
  country: string;
  city: string;
  address: string;
  contact_person: string;
  phone: string;
  email: string;
  room_types: string;
  contract_price: number;
  selling_price: number;
  currency: string;
  check_in_time: string;
  check_out_time: string;
  notes: string;
}

export type FlightStatus = 'Reserved' | 'Confirmed' | 'Ticketed' | 'Cancelled' | 'Completed';

export interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  passenger: string;
  booking_reference: string;
  ticket_number: string;
  ticket_cost: number;
  selling_price: number;
  currency: string;
  status: FlightStatus;
  ticket_document_url?: string;
}

export type SupplierType = 
  | 'Airlines' 
  | 'Hotels' 
  | 'Transportation Companies' 
  | 'Tour Operators' 
  | 'Visa Providers' 
  | 'Guides' 
  | 'Cruise Companies' 
  | 'Other';

export interface Supplier {
  id: string;
  supplier_name: string;
  name?: string; // alias
  type: SupplierType;
  category?: string; // alias
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_information: string;
  currency: string;
  payment_terms: string;
  notes: string;
  outstanding_balance: number;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Credit Card' | 'InstaPay' | 'Other';

export interface CustomerPayment {
  id: string;
  payment_id: string;
  customer_id: string;
  customer_name?: string;
  reservation_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  date: string;
  employee_id: string;
  employee_name?: string;
  notes: string;
}

export interface SupplierPayment {
  id: string;
  payment_id?: string;
  supplier_id: string;
  supplier_name?: string;
  reservation_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string;
  notes: string;
}

export type ExpenseCategory = 
  | 'Office Rent'
  | 'Electricity'
  | 'Water'
  | 'Internet'
  | 'Telephone'
  | 'Advertising'
  | 'Facebook Ads'
  | 'Instagram Ads'
  | 'Google Ads'
  | 'Transportation'
  | 'Visa Expenses'
  | 'Hotel Expenses'
  | 'Flight Expenses'
  | 'Tour Guide'
  | 'Commission'
  | 'Office Supplies'
  | 'Maintenance'
  | 'Software / Subscriptions'
  | 'Other'
  | 'Salaries' 
  | 'Office' 
  | 'Marketing' 
  | 'Bank Fees' 
  | 'Software';

export interface Expense {
  id: string;
  expense_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  converted_amount?: number;
  date: string;
  employee_id?: string;
  employee_name?: string;
  payment_method: PaymentMethod;
  paid_by?: string;
  supplier_id?: string;
  supplier_name?: string;
  related_trip_id?: string;
  invoice_receipt_number?: string;
  attachment_url?: string;
  notes: string;
  status?: 'Paid' | 'Pending' | 'Approved';
}

export interface PayrollRecord {
  id: string;
  payroll_month: string; // e.g. "2026-09"
  employee_id: string;
  employee_name: string;
  job_title: string;
  department: string;
  basic_salary: number;
  allowances: number;
  commission: number;
  bonus: number;
  deductions: number;
  advances: number;
  net_salary: number;
  currency: string;
  status: 'Pending' | 'Partially Paid' | 'Paid';
  payment_date?: string;
  payment_method?: string;
  paid_amount?: number;
  transaction_reference?: string;
  notes?: string;
}

export interface EmployeeAdvance {
  id: string;
  advance_id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  amount: number;
  currency: string;
  reason: string;
  repayment_method: string;
  outstanding_amount: number;
  status: 'Outstanding' | 'Partially Repaid' | 'Fully Repaid';
}

export interface CommissionRecord {
  id: string;
  commission_id: string;
  employee_id: string;
  employee_name: string;
  customer_id?: string;
  customer_name?: string;
  reservation_id?: string;
  trip_name?: string;
  sale_amount: number;
  commission_percentage: number;
  commission_amount: number;
  currency: string;
  date: string;
  status: 'Pending' | 'Paid' | 'Added to Payroll';
}

export interface FinanceAuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Paid' | 'Generated Payroll' | 'Exported Report';
  record_type: string;
  record_id: string;
  previous_value?: string;
  new_value?: string;
  date_time: string;
}

export type EmployeePosition = 
  | 'Administrator' 
  | 'Manager' 
  | 'Sales' 
  | 'Reservation Agent' 
  | 'Accountant' 
  | 'Operations' 
  | 'Customer Service';

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  email: string;
  position: EmployeePosition;
  is_admin?: boolean;
  department: string;
  joining_date: string;
  salary: number;
  commission_rate: number; // percentage e.g. 5%
  status: 'Active' | 'On Leave' | 'Inactive';
  account_status?: 'Active' | 'Inactive' | 'Suspended';
  login_access_enabled?: boolean;
  permissions?: string[];
  deactivated_at?: string;
  deactivated_by?: string;
  username?: string;
  password?: string;
  reservations_count?: number;
  total_sales?: number;
  total_profit?: number;
}

export type DocumentType = 
  | 'Passport' 
  | 'Visa' 
  | 'Flight Ticket' 
  | 'Hotel Voucher' 
  | 'Invoice' 
  | 'Contract' 
  | 'Receipt' 
  | 'Other';

export interface TravelDocument {
  id: string;
  document_name: string;
  document_type: DocumentType;
  linked_to_type: 'Customer' | 'Reservation' | 'Supplier';
  linked_id: string;
  linked_name?: string;
  file_url: string;
  upload_date: string;
  file_size: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  task_name: string;
  assigned_employee_id: string;
  assigned_employee_name?: string;
  customer_id?: string;
  customer_name?: string;
  reservation_id?: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string;
}

export type RequestAction = 'Edit' | 'Delete';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PermissionRequest {
  id: string;
  request_id: string;
  employee_id: string;
  employee_name: string;
  employee_role: UserRole;
  module: string;
  item_id: string;
  item_name: string;
  action_type: RequestAction;
  reason: string;
  proposed_changes?: any;
  status: RequestStatus;
  created_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'trip' | 'flight' | 'hotel' | 'payment' | 'supplier' | 'task' | 'reservation' | 'cancellation' | 'action' | 'permission';
  date: string;
  read: boolean;
  link_id?: string;
}

export interface ExchangeRate {
  currency: string;
  rate_to_usd: number; // 1 USD = X Currency
}

export interface CompanySettings {
  company_name: string;
  logo: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  tax_number: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_iban_swift?: string;
  bank_beneficiary_name?: string;
  default_currency: string;
  invoice_prefix: string;
  reservation_prefix: string;
  voucher_prefix?: string;
  payment_methods: string[];
  exchange_rates: ExchangeRate[];
  installment_partners?: InstallmentPartnerAgreement[];
}

export interface ActivityLog {
  id: string;
  user_name: string;
  action: string;
  module: string;
  record: string;
  date: string;
  time: string;
}

export type InvoiceItemType = 
  | 'Tour Package' 
  | 'Voucher'
  | 'Visa' 
  | 'Transfer' 
  | 'Cruise' 
  | 'Tour' 
  | 'Day Trip' 
  | 'Hotel' 
  | 'Flight' 
  | 'Custom';

export interface InvoiceItem {
  id: string;
  item_type: InvoiceItemType;
  item_reference_id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export type InvoiceStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'Cancelled';
export type InvoiceRecipientType = 'Customer' | 'Supplier';

export interface Invoice {
  id: string;
  invoice_number: string;
  recipient_type?: InvoiceRecipientType;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_passport?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_email?: string;
  supplier_phone?: string;
  supplier_type?: string;
  reservation_id?: string;
  issue_date: string;
  due_date: string;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: InvoiceStatus;
  payment_method?: PaymentMethod;
  notes?: string;
  terms?: string;
  manager_name?: string;
  created_by_employee?: string;
}

export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Leave' | 'Holiday' | 'Day Off';

export interface AttendanceRecord {
  id: string;
  attendance_id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status: AttendanceStatus;
  late_minutes: number;
  early_departure_minutes: number;
  total_working_hours: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSettings {
  official_check_in: string;
  official_check_out: string;
  grace_period_minutes: number;
  required_working_hours: number;
  working_days: string[];
  weekend_days: string[];
  absence_deduction_type: 'No Deduction' | 'Deduct Daily Rate' | 'Custom Amount';
  late_deduction_type: 'No Deduction' | 'Per Minute' | 'Per Late Day' | 'Custom Rule';
}

