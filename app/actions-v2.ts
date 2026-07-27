"use server";

import { sendDocumentEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
import type { DashboardStats, Quote } from "@/type";
import { INVOICE_STATUS_LABELS } from "@/type";
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
  let pendingTotal = 0;
  let draftCount = 0;
  const clientTotals = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthlyPaid = new Map(monthKeys.map((k) => [k, 0]));
  const monthlyCount = new Map(monthKeys.map((k) => [k, 0]));

  for (const invoice of invoices) {
    const { ttc } = calcTotal(invoice.lines, invoice.vatActive, invoice.vatRate);
    statusCounts.set(
      invoice.status,
      (statusCounts.get(invoice.status) || 0) + 1,
    );

    if (invoice.status === "PAID") paidTotal += ttc;
    if (invoice.status === "OVERDUE") {
      overdueCount += 1;
      overdueTotal += ttc;
    }
    if (invoice.status === "SENT") {
      pendingCount += 1;
      pendingTotal += ttc;
    }
    if (invoice.status === "DRAFT") draftCount += 1;

    const clientName = invoice.clientName || invoice.client?.name || "Sans client";
    clientTotals.set(clientName, (clientTotals.get(clientName) || 0) + ttc);

    const created = new Date(invoice.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyCount.has(key)) {
      monthlyCount.set(key, (monthlyCount.get(key) || 0) + 1);
    }
    if (invoice.status === "PAID" && monthlyPaid.has(key)) {
      monthlyPaid.set(key, (monthlyPaid.get(key) || 0) + ttc);
    }
  }

  const monthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", {
      month: "short",
    });
  };

  const statusBreakdown = (
    ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const
  ).map((status) => ({
    status,
    label: INVOICE_STATUS_LABELS[status],
    count: statusCounts.get(status) || 0,
  }));

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
    pendingTotal,
    draftCount,
    currency,
    topClients,
    recentInvoices: invoices.slice(0, 5),
    monthlyRevenue: monthKeys.map((key) => ({
      label: monthLabel(key),
      total: monthlyPaid.get(key) || 0,
    })),
    monthlyInvoices: monthKeys.map((key) => ({
      label: monthLabel(key),
      count: monthlyCount.get(key) || 0,
    })),
    statusBreakdown,
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
  try {
    const user = await requireDbUser();
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: user.organizationId },
      include: { lines: true, client: true },
    });
    if (!invoice) {
      return { mode: "error" as const, message: "Facture introuvable" };
    }

    const to =
      toEmail?.trim() ||
      invoice.clientEmail ||
      invoice.client?.email ||
      "";

    if (!to) {
      return {
        mode: "error" as const,
        message:
          "Aucune adresse email client. Renseignez-en une dans la fiche facture.",
      };
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
  } catch (err) {
    console.error("emailInvoice", err);
    return {
      mode: "error" as const,
      message:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi de la facture.",
    };
  }
}

export async function emailQuote(quoteId: string, toEmail?: string) {
  try {
    const user = await requireDbUser();
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, organizationId: user.organizationId },
      include: { lines: true, client: true },
    });
    if (!quote) {
      return { mode: "error" as const, message: "Devis introuvable" };
    }

    const to =
      toEmail?.trim() || quote.clientEmail || quote.client?.email || "";

    if (!to) {
      return {
        mode: "error" as const,
        message:
          "Aucune adresse email client. Renseignez-en une sur le devis.",
      };
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
  } catch (err) {
    console.error("emailQuote", err);
    return {
      mode: "error" as const,
      message:
        err instanceof Error
          ? err.message
          : "Erreur lors de l'envoi du devis.",
    };
  }
}

export async function uploadCompanyLogo(formData: FormData) {
  try {
    const user = await requireDbUser();
    const file = formData.get("logo") as File | null;
    if (!file || file.size === 0) {
      return { ok: false as const, error: "Fichier manquant" };
    }
    if (file.size > 1 * 1024 * 1024) {
      return { ok: false as const, error: "Logo trop volumineux (max 1 Mo)" };
    }

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      return {
        ok: false as const,
        error: "Format non supporté (PNG, JPG, WEBP, SVG)",
      };
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

    return { ok: true as const, logoUrl };
  } catch (err) {
    console.error("uploadCompanyLogo", err);
    return {
      ok: false as const,
      error:
        err instanceof Error
          ? err.message
          : "Upload impossible. Réessayez avec une image plus légère.",
    };
  }
}
