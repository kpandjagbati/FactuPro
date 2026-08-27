import type {
  Client,
  CompanyProfile,
  Expense,
  Invoice as PrismaInvoice,
  InvoiceLine,
  InvoiceStatus,
  Payment,
  Product,
  Quote as PrismaQuote,
  QuoteLine,
  QuoteStatus,
} from "@prisma/client";

export type Invoice = PrismaInvoice & {
  lines: InvoiceLine[];
  client?: Client | null;
  payments?: Payment[];
};

export type Quote = PrismaQuote & {
  lines: QuoteLine[];
  client?: Client | null;
};

export type Totals = {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  totalPaid?: number;
  remainingDue?: number;
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
  currency: string;
  topClients: { name: string; total: number }[];
  recentInvoices: Invoice[];
  recentExpenses: Expense[];
  monthlyRevenue: { label: string; total: number }[];
  monthlyExpenses: { label: string; total: number }[];
  monthlyInvoices: { label: string; count: number }[];
  statusBreakdown: { status: InvoiceStatus; label: string; count: number }[];
};

export type {
  Client,
  CompanyProfile,
  Expense,
  InvoiceLine,
  InvoiceStatus,
  Payment,
  Product,
  QuoteLine,
  QuoteStatus,
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
  "Virement bancaire",
  "Mobile Money (Wave / MoMo / Orange)",
  "Espèces",
  "Chèque",
  "Carte bancaire",
  "Autre",
] as const;
