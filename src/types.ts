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
  | 'Transportation' 
  | 'Travel Package' 
  | 'Other';

export type ReservationStatus = 
  | 'Pending' 
  | 'Confirmed' 
  | 'Paid' 
  | 'Partially Paid' 
  | 'Cancelled' 
  | 'Completed';

export interface Reservation {
  id: string;
  reservation_id: string;
  customer_id: string;
  customer_name?: string;
  service_type: ServiceType;
  booking_date: string;
  travel_date: string;
  return_date: string;
  number_of_travelers: number;
  destination: string;
  supplier_id: string;
  supplier_name?: string;
  employee_id: string;
  employee_name?: string;
  selling_price: number;
  cost_price: number;
  paid_amount: number;
  remaining_amount: number;
  profit: number;
  currency: string;
  payment_status: 'Pending' | 'Paid' | 'Partially Paid' | 'Refunded';
  reservation_status: ReservationStatus;
  notes: string;
}

export type PackageStatus = 'Draft' | 'Available' | 'Fully Booked' | 'Closed' | 'Cancelled';

export interface TourPackage {
  id: string;
  package_name: string;
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
  selling_price: number;
  currency?: string;
  profit_margin: number;
  included_services: string[];
  excluded_services: string[];
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
  type: SupplierType;
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
  | 'Salaries' 
  | 'Office' 
  | 'Marketing' 
  | 'Transportation' 
  | 'Bank Fees' 
  | 'Software' 
  | 'Commission' 
  | 'Other';

export interface Expense {
  id: string;
  expense_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  date: string;
  employee_id: string;
  employee_name?: string;
  payment_method: PaymentMethod;
  notes: string;
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
  department: string;
  joining_date: string;
  salary: number;
  commission_rate: number; // percentage e.g. 5%
  status: 'Active' | 'On Leave' | 'Inactive';
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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'trip' | 'flight' | 'hotel' | 'payment' | 'supplier' | 'task' | 'reservation' | 'cancellation';
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
  payment_methods: string[];
  exchange_rates: ExchangeRate[];
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

export type InvoiceItemType = 'Tour Package' | 'Hotel' | 'Flight' | 'Custom';

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
