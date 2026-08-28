import type {
  Client,
  CompanyProfile,
  CreditNote as PrismaCreditNote,
  CreditNoteLine,
  Expense,
  Invoice as PrismaInvoice,
  InvoiceLine,
  InvoiceStatus,
  Payment,
  Product,
  Quote as PrismaQuote,
  QuoteLine,
  QuoteStatus,
  RecurringFrequency,
  RecurringInvoice as PrismaRecurringInvoice,
  RecurringInvoiceLine,
} from "@prisma/client";

export type Invoice = PrismaInvoice & {
  lines: InvoiceLine[];
  client?: Client | null;
  payments?: Payment[];
  creditNotes?: CreditNote[];
};

export type Quote = PrismaQuote & {
  lines: QuoteLine[];
  client?: Client | null;
};

export type RecurringInvoice = PrismaRecurringInvoice & {
  lines: RecurringInvoiceLine[];
  client?: Client | null;
  generatedInvoices?: PrismaInvoice[];
};

export type CreditNote = PrismaCreditNote & {
  lines: CreditNoteLine[];
  client?: Client | null;
  invoice?: PrismaInvoice | null;
};

export type Totals = {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  totalPaid?: number;
  remainingDue?: number;
  totalCredited?: number;
};

export type CompanyProfileInput = {
  name: string;
  address: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  iban?: string | null;
  logoUrl?: string | null;
  paymentTerms?: string | null;
};

export type ClientInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string;
  taxId?: string | null;
};

export type ProductInput = {
  name: string;
  description?: string | null;
  unitPrice: number;
  unit?: string;
  category?: string | null;
  trackStock?: boolean;
  stockQuantity?: number;
  minStockAlert?: number;
};

export type ExpenseInput = {
  title: string;
  amount: number;
  category: string;
  expenseDate: string | Date;
  receiptUrl?: string | null;
  notes?: string | null;
};

export type PaymentInput = {
  amount: number;
  paymentDate?: string | Date;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
};

export type RecurringInvoiceInput = {
  clientId?: string | null;
  title: string;
  frequency: RecurringFrequency;
  nextRunDate: string | Date;
  endDate?: string | Date | null;
  active: boolean;
  issuerName?: string;
  issuerAddress?: string;
  clientName?: string;
  clientAddress?: string;
  clientEmail?: string | null;
  notes?: string | null;
  vatActive: boolean;
  vatRate: number;
  currency: string;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type CreditNoteInput = {
  invoiceId?: string | null;
  clientId?: string | null;
  reason: string;
  creditDate: string | Date;
  issuerName?: string;
  issuerAddress?: string;
  clientName?: string;
  clientAddress?: string;
  clientEmail?: string | null;
  notes?: string | null;
  vatActive: boolean;
  vatRate: number;
  currency: string;
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type DashboardStats = {
  invoiceCount: number;
  quoteCount: number;
  paidTotal: number;
  overdueCount: number;
  overdueTotal: number;
  pendingCount: number;
  pendingTotal: number;
  draftCount: number;
  totalExpenses: number;
  netMargin: number;
  recurringCount: number;
  creditNotesTotal: number;
  lowStockCount?: number;
  currency: string;
  topClients: { name: string; total: number }[];
  recentInvoices: Invoice[];
  recentExpenses: Expense[];
  monthlyRevenue: { label: string; total: number }[];
  monthlyExpenses: { label: string; total: number }[];
  monthlyInvoices: { label: string; count: number }[];
  statusBreakdown: { status: InvoiceStatus; label: string; count: number }[];
};

export type AccountingReport = {
  period: { start: string; end: string };
  currency: string;
  totalInvoicedHT: number;
  totalInvoicedVAT: number;
  totalInvoicedTTC: number;
  totalPaidTTC: number;
  totalCreditNotesTTC: number;
  totalExpenses: number;
  netProfit: number;
  salesJournal: {
    id: string;
    date: Date | null;
    number: string;
    clientName: string;
    status: InvoiceStatus;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
    paidAmount: number;
  }[];
  expensesJournal: {
    id: string;
    date: Date;
    title: string;
    category: string;
    amount: number;
  }[];
  creditNotesJournal: {
    id: string;
    date: Date;
    number: string;
    invoiceNumber?: string | null;
    clientName: string;
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
  }[];
};

export type {
  Client,
  CompanyProfile,
  CreditNoteLine,
  Expense,
  InvoiceLine,
  InvoiceStatus,
  Payment,
  Product,
  QuoteLine,
  QuoteStatus,
  RecurringFrequency,
  RecurringInvoiceLine,
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "En attente",
  PAID: "Payée",
  CANCELLED: "Annulée",
  OVERDUE: "Impayée",
};

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "PAID",
  "CANCELLED",
  "OVERDUE",
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CONVERTED: "Converti",
};

export const QUOTE_STATUSES: QuoteStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "CONVERTED",
];

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
};

export const RECURRING_FREQUENCIES: RecurringFrequency[] = [
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
];

export const EXPENSE_CATEGORIES = [
  "Matériel & Équipement",
  "Logiciels & Hébergement",
  "Sous-traitance & Salaires",
  "Déplacements & Transport",
  "Marketing & Publicité",
  "Fournitures de bureau",
  "Impôts & Taxes",
  "Autre dépense",
] as const;

export const PAYMENT_METHODS = [
  "Mixx by Yas (Togocom)",
  "Moov Money (Moov Africa)",
  "Virement bancaire",
  "Espèces",
  "Chèque",
  "Carte bancaire",
  "Autre",
] as const;
