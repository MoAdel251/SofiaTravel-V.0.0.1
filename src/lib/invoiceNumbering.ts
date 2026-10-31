import type { CompanySettings, Invoice } from '../types';

export type InvoiceNumberKind = 'customer' | 'supplier';

export const INVOICE_SEQUENCE_START = 1001;
export const DEFAULT_CUSTOMER_INVOICE_PREFIX = 'INV-2026-';
export const DEFAULT_SUPPLIER_INVOICE_PREFIX = 'BILL-2026-';

type InvoiceNumberSource = Pick<Invoice, 'invoice_number' | 'recipient_type' | 'supplier_id' | 'customer_id'>;

/**
 * Classifies an invoice. Records created before `recipient_type` existed are
 * treated as supplier bills when they only carry a supplier reference.
 */
export function isSupplierInvoice(invoice: Pick<Invoice, 'recipient_type' | 'supplier_id' | 'customer_id'>): boolean {
  if (invoice.recipient_type) {
    return invoice.recipient_type === 'Supplier';
  }
  return Boolean(invoice.supplier_id) && !invoice.customer_id;
}

export function getInvoiceKind(invoice: Pick<Invoice, 'recipient_type' | 'supplier_id' | 'customer_id'>): InvoiceNumberKind {
  return isSupplierInvoice(invoice) ? 'supplier' : 'customer';
}

export function getInvoicePrefix(
  settings: Partial<CompanySettings> | null | undefined,
  kind: InvoiceNumberKind
): string {
  const configured = kind === 'supplier' ? settings?.supplier_invoice_prefix : settings?.invoice_prefix;
  const fallback = kind === 'supplier' ? DEFAULT_SUPPLIER_INVOICE_PREFIX : DEFAULT_CUSTOMER_INVOICE_PREFIX;
  const prefix = (configured || '').trim();

  // "INV-" was the legacy client-side default even though every stored
  // customer invoice already uses the year-based format. Upgrade it so the
  // customer series stays visually consistent with historical invoices.
  if (kind === 'customer' && prefix === 'INV-') {
    return DEFAULT_CUSTOMER_INVOICE_PREFIX;
  }

  return prefix || fallback;
}

/** Returns the trailing numeric sequence from a formatted invoice number. */
export function extractInvoiceSequence(invoiceNumber?: string | null): number | null {
  if (!invoiceNumber) return null;
  const match = String(invoiceNumber).match(/(\d+)\s*$/);
  if (!match) return null;
  const sequence = Number.parseInt(match[1], 10);
  return Number.isFinite(sequence) ? sequence : null;
}

/**
 * Computes the next sequence for one invoice family only. Customer and
 * supplier sequences are therefore fully independent, and the highest
 * existing number is used so deletions never cause duplicate numbers.
 */
export function getNextInvoiceSequence(
  invoices: InvoiceNumberSource[] = [],
  kind: InvoiceNumberKind
): number {
  let highest = INVOICE_SEQUENCE_START - 1;

  for (const invoice of invoices) {
    if (getInvoiceKind(invoice) !== kind) continue;
    const sequence = extractInvoiceSequence(invoice.invoice_number);
    if (sequence !== null && sequence > highest) {
      highest = sequence;
    }
  }

  return Math.max(highest + 1, INVOICE_SEQUENCE_START);
}

export function buildInvoiceNumber(
  invoices: InvoiceNumberSource[] = [],
  settings: Partial<CompanySettings> | null | undefined,
  kind: InvoiceNumberKind
): string {
  const prefix = getInvoicePrefix(settings, kind);
  const usedNumbers = new Set(
    invoices
      .map(invoice => (invoice.invoice_number || '').trim().toLowerCase())
      .filter(Boolean)
  );

  let sequence = getNextInvoiceSequence(invoices, kind);
  let candidate = `${prefix}${sequence}`;

  // Keep numbering per invoice family, but never reuse a number that already
  // exists in the other family (legacy supplier bills may still use the
  // customer prefix).
  while (usedNumbers.has(candidate.toLowerCase())) {
    sequence += 1;
    candidate = `${prefix}${sequence}`;
  }

  return candidate;
}
