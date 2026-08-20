import type {
  Client,
  CompanyProfile,
  Invoice as PrismaInvoice,
  InvoiceLine,
  InvoiceStatus,
  Quote as PrismaQuote,
  QuoteLine,
  QuoteStatus,
} from "@prisma/client";

export type Invoice = PrismaInvoice & {
  lines: InvoiceLine[];
  client?: Client | null;
};

export type Quote = PrismaQuote & {
  lines: QuoteLine[];
  client?: Client | null;
};

export type Totals = {
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
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

export type DashboardStats = {
  invoiceCount: number;
  quoteCount: number;
  paidTotal: number;
  overdueCount: number;
  overdueTotal: number;
  pendingCount: number;
  pendingTotal: number;
  draftCount: number;
  currency: string;
  topClients: { name: string; total: number }[];
  recentInvoices: Invoice[];
  monthlyRevenue: { label: string; total: number }[];
  monthlyInvoices: { label: string; count: number }[];
  statusBreakdown: { status: InvoiceStatus; label: string; count: number }[];
};

export type { Client, CompanyProfile, InvoiceLine, InvoiceStatus, QuoteLine, QuoteStatus };

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
