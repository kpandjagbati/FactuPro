"use server";

import { sendDocumentEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
import type { DashboardStats, Quote } from "@/type";
import type { QuoteStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: { include: { companyProfile: true } },
    },
  });

  if (!user) throw new Error("Utilisateur introuvable. Rechargez la page.");
  return user;
}

function calcTotal(
  lines: { quantity: number; unitPrice: number }[],
  vatActive: boolean,
  vatRate: number,
) {
  const ht = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  const vat = vatActive ? ht * (vatRate / 100) : 0;
  return { ht, vat, ttc: ht + vat };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const user = await requireDbUser();
  const orgId = user.organizationId;
  const currency = user.organization.currency || "XOF";

  const [invoices, quotes] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: orgId },
      include: { lines: true, client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.count({ where: { organizationId: orgId } }),
  ]);

  let paidTotal = 0;
  let overdueTotal = 0;
  let overdueCount = 0;
  let pendingCount = 0;
  let draftCount = 0;
  const clientTotals = new Map<string, number>();

  for (const invoice of invoices) {
    const { ttc } = calcTotal(invoice.lines, invoice.vatActive, invoice.vatRate);
    if (invoice.status === "PAID") paidTotal += ttc;
    if (invoice.status === "OVERDUE") {
      overdueCount += 1;
      overdueTotal += ttc;
    }
    if (invoice.status === "SENT") pendingCount += 1;
    if (invoice.status === "DRAFT") draftCount += 1;

    const clientName = invoice.clientName || invoice.client?.name || "Sans client";
    clientTotals.set(clientName, (clientTotals.get(clientName) || 0) + ttc);
  }

  const topClients = [...clientTotals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    invoiceCount: invoices.length,
    quoteCount: quotes,
    paidTotal,
    overdueCount,
    overdueTotal,
    pendingCount,
    draftCount,
    currency,
    topClients,
    recentInvoices: invoices.slice(0, 5),
  };
}

export async function getQuotes() {
  const user = await requireDbUser();
  return prisma.quote.findMany({
    where: { organizationId: user.organizationId },
    include: { lines: true, client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmptyQuote(name: string) {
  const user = await requireDbUser();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 60) {
    throw new Error("Nom de devis invalide");
  }

  const year = new Date().getFullYear();
  const organization = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { quoteCounter: { increment: 1 } },
    include: { companyProfile: true },
  });

  const number = `DEV-${year}-${String(organization.quoteCounter).padStart(4, "0")}`;
  const profile = organization.companyProfile;

  return prisma.quote.create({
    data: {
      organizationId: user.organizationId,
      number,
      name: trimmed,
      currency: organization.currency || "XOF",
      issuerName: profile?.name || "",
      issuerAddress: profile?.address || "",
      quoteDate: new Date(),
      vatRate: 18,
      vatActive: false,
      status: "DRAFT",
    },
    include: { lines: true },
  });
}

export async function getQuoteById(quoteId: string) {
  const user = await requireDbUser();
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: user.organizationId },
    include: { lines: true, client: true },
  });
  if (!quote) throw new Error("Devis non trouvé");
  return quote;
}

export async function updateQuote(quote: Quote) {
  const user = await requireDbUser();
  const existing = await prisma.quote.findFirst({
    where: { id: quote.id, organizationId: user.organizationId },
    include: { lines: true },
  });
  if (!existing) throw new Error("Devis introuvable");

  const quoteDate =
    typeof quote.quoteDate === "string"
      ? new Date(quote.quoteDate)
      : quote.quoteDate;
  const validUntil =
    typeof quote.validUntil === "string"
      ? new Date(quote.validUntil)
      : quote.validUntil;

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      name: quote.name,
      issuerName: quote.issuerName,
      issuerAddress: quote.issuerAddress,
      clientName: quote.clientName,
      clientAddress: quote.clientAddress,
      clientEmail: quote.clientEmail || null,
      clientId: quote.clientId || null,
      quoteDate:
        quoteDate && !Number.isNaN(quoteDate.getTime()) ? quoteDate : null,
      validUntil:
        validUntil && !Number.isNaN(validUntil.getTime()) ? validUntil : null,
      vatActive: quote.vatActive,
      vatRate: quote.vatRate,
      status: quote.status as QuoteStatus,
      currency: quote.currency || "XOF",
    },
  });

  const linesToDelete = existing.lines.filter(
    (l) => !quote.lines.some((ql) => ql.id === l.id),
  );
  if (linesToDelete.length > 0) {
    await prisma.quoteLine.deleteMany({
      where: { id: { in: linesToDelete.map((l) => l.id) } },
    });
  }

  for (const line of quote.lines) {
    const existingLine = existing.lines.find((l) => l.id === line.id);
    if (existingLine) {
      await prisma.quoteLine.update({
        where: { id: line.id },
        data: {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        },
      });
    } else {
      await prisma.quoteLine.create({
        data: {
          quoteId: quote.id,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        },
      });
    }
  }

  return getQuoteById(quote.id);
}

export async function deleteQuote(quoteId: string) {
  const user = await requireDbUser();
  const existing = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: user.organizationId },
  });
  if (!existing) throw new Error("Devis introuvable");
  await prisma.quote.delete({ where: { id: quoteId } });
}

export async function convertQuoteToInvoice(quoteId: string) {
  const user = await requireDbUser();
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: user.organizationId },
    include: { lines: true, invoice: true },
  });

  if (!quote) throw new Error("Devis introuvable");
  if (quote.status === "CONVERTED" || quote.invoice) {
    throw new Error("Ce devis a déjà été converti");
  }

  const year = new Date().getFullYear();
  const organization = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { invoiceCounter: { increment: 1 } },
  });
  const number = `FAC-${year}-${String(organization.invoiceCounter).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      quoteId: quote.id,
      clientId: quote.clientId,
      number,
      name: quote.name,
      issuerName: quote.issuerName,
      issuerAddress: quote.issuerAddress,
      clientName: quote.clientName,
      clientAddress: quote.clientAddress,
      clientEmail: quote.clientEmail,
      invoiceDate: new Date(),
      vatActive: quote.vatActive,
      vatRate: quote.vatRate,
      status: "DRAFT",
      currency: quote.currency,
      lines: {
        create: quote.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      },
    },
    include: { lines: true },
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "CONVERTED" },
  });

  return invoice;
}

export async function emailInvoice(invoiceId: string, toEmail?: string) {
  const user = await requireDbUser();
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: { lines: true, client: true },
  });
  if (!invoice) throw new Error("Facture introuvable");

  const to =
    toEmail?.trim() ||
    invoice.clientEmail ||
    invoice.client?.email ||
    "";

  if (!to) {
    throw new Error(
      "Aucune adresse email client. Renseignez-en une dans la fiche facture.",
    );
  }

  const { ttc } = calcTotal(invoice.lines, invoice.vatActive, invoice.vatRate);
  const companyName =
    user.organization.companyProfile?.name || user.organization.name;

  const result = await sendDocumentEmail({
    kind: "invoice",
    to,
    number: invoice.number,
    name: invoice.name,
    companyName,
    totalTTC: ttc,
    currency: invoice.currency,
  });

  if (result.mode === "resend") {
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT", clientEmail: to },
      });
    } else {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { clientEmail: to },
      });
    }
  }

  return result;
}

export async function emailQuote(quoteId: string, toEmail?: string) {
  const user = await requireDbUser();
  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: user.organizationId },
    include: { lines: true, client: true },
  });
  if (!quote) throw new Error("Devis introuvable");

  const to =
    toEmail?.trim() || quote.clientEmail || quote.client?.email || "";

  if (!to) {
    throw new Error(
      "Aucune adresse email client. Renseignez-en une sur le devis.",
    );
  }

  const { ttc } = calcTotal(quote.lines, quote.vatActive, quote.vatRate);
  const companyName =
    user.organization.companyProfile?.name || user.organization.name;

  const result = await sendDocumentEmail({
    kind: "quote",
    to,
    number: quote.number,
    name: quote.name,
    companyName,
    totalTTC: ttc,
    currency: quote.currency,
  });

  if (result.mode === "resend" && quote.status === "DRAFT") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "SENT", clientEmail: to },
    });
  } else if (result.mode === "resend") {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { clientEmail: to },
    });
  }

  return result;
}

export async function uploadCompanyLogo(formData: FormData) {
  const user = await requireDbUser();
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    throw new Error("Fichier manquant");
  }
  // Stocké en base (data URL) — le FS Vercel est en lecture seule
  if (file.size > 1 * 1024 * 1024) {
    throw new Error("Logo trop volumineux (max 1 Mo)");
  }

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    throw new Error("Format non supporté (PNG, JPG, WEBP, SVG)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const logoUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

  await prisma.companyProfile.upsert({
    where: { organizationId: user.organizationId },
    update: { logoUrl },
    create: {
      organizationId: user.organizationId,
      name: user.organization.name,
      logoUrl,
    },
  });

  return logoUrl;
}
