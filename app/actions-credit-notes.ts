"use server";

import prisma from "@/lib/prisma";
import type { CreditNote, CreditNoteInput } from "@/type";
import { auth } from "@clerk/nextjs/server";

async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: { companyProfile: true },
      },
    },
  });

  if (!user) throw new Error("Utilisateur introuvable. Rechargez la page.");
  return user;
}

export async function getCreditNotes(): Promise<CreditNote[]> {
  const user = await requireDbUser();
  return prisma.creditNote.findMany({
    where: { organizationId: user.organizationId },
    include: {
      lines: true,
      client: true,
      invoice: true,
    },
    orderBy: { creditDate: "desc" },
  });
}

export async function getCreditNoteById(id: string): Promise<CreditNote | null> {
  const user = await requireDbUser();
  return prisma.creditNote.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      lines: true,
      client: true,
      invoice: true,
    },
  });
}

export async function createCreditNote(
  data: CreditNoteInput,
): Promise<CreditNote> {
  const user = await requireDbUser();
  const year = new Date().getFullYear();

  const organization = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { creditNoteCounter: { increment: 1 } },
  });

  const number = `AV-${year}-${String(organization.creditNoteCounter).padStart(3, "0")}`;

  return prisma.creditNote.create({
    data: {
      organizationId: user.organizationId,
      invoiceId: data.invoiceId || null,
      clientId: data.clientId || null,
      number,
      reason: data.reason.trim(),
      creditDate: data.creditDate ? new Date(data.creditDate) : new Date(),
      issuerName: data.issuerName || "",
      issuerAddress: data.issuerAddress || "",
      clientName: data.clientName || "",
      clientAddress: data.clientAddress || "",
      clientEmail: data.clientEmail || null,
      notes: data.notes || null,
      vatActive: data.vatActive,
      vatRate: Number(data.vatRate) || 0,
      currency: data.currency || user.organization.currency || "XOF",
      lines: {
        create: data.lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
        })),
      },
    },
    include: {
      lines: true,
      client: true,
      invoice: true,
    },
  });
}

export async function createCreditNoteFromInvoice(
  invoiceId: string,
  reason = "Annulation / Remise sur facture",
): Promise<CreditNote> {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: { lines: true, client: true },
  });

  if (!invoice) throw new Error("Facture introuvable");

  const year = new Date().getFullYear();
  const organization = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { creditNoteCounter: { increment: 1 } },
  });

  const number = `AV-${year}-${String(organization.creditNoteCounter).padStart(3, "0")}`;

  return prisma.creditNote.create({
    data: {
      organizationId: user.organizationId,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      number,
      reason,
      creditDate: new Date(),
      issuerName: invoice.issuerName,
      issuerAddress: invoice.issuerAddress,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      clientEmail: invoice.clientEmail,
      notes: `Avoir émis au titre de la facture ${invoice.number}`,
      vatActive: invoice.vatActive,
      vatRate: invoice.vatRate,
      currency: invoice.currency,
      lines: {
        create: invoice.lines.map((l) => ({
          description: `Régularisation: ${l.description}`,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      },
    },
    include: {
      lines: true,
      client: true,
      invoice: true,
    },
  });
}

export async function deleteCreditNote(id: string): Promise<void> {
  const user = await requireDbUser();
  await prisma.creditNote.deleteMany({
    where: { id, organizationId: user.organizationId },
  });
}
