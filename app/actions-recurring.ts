"use server";

import prisma from "@/lib/prisma";
import type { RecurringInvoice, RecurringInvoiceInput } from "@/type";
import type { RecurringFrequency } from "@prisma/client";
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

function computeNextDate(current: Date, freq: RecurringFrequency): Date {
  const next = new Date(current);
  switch (freq) {
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

export async function getRecurringInvoices(): Promise<RecurringInvoice[]> {
  const user = await requireDbUser();
  return prisma.recurringInvoice.findMany({
    where: { organizationId: user.organizationId },
    include: {
      lines: true,
      client: true,
      generatedInvoices: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecurringInvoiceById(
  id: string,
): Promise<RecurringInvoice | null> {
  const user = await requireDbUser();
  return prisma.recurringInvoice.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      lines: true,
      client: true,
      generatedInvoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createRecurringInvoice(
  data: RecurringInvoiceInput,
): Promise<RecurringInvoice> {
  const user = await requireDbUser();
  const company = user.organization.companyProfile;

  return prisma.recurringInvoice.create({
    data: {
      organizationId: user.organizationId,
      clientId: data.clientId || null,
      title: data.title.trim(),
      frequency: data.frequency,
      nextRunDate: new Date(data.nextRunDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      active: data.active ?? true,
      issuerName: data.issuerName || company?.name || "",
      issuerAddress: data.issuerAddress || company?.address || "",
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
    },
  });
}

export async function updateRecurringInvoice(
  id: string,
  data: RecurringInvoiceInput,
): Promise<RecurringInvoice> {
  const user = await requireDbUser();

  // Supprimer les anciennes lignes et insérer les nouvelles
  await prisma.recurringInvoiceLine.deleteMany({
    where: { recurringInvoiceId: id },
  });

  return prisma.recurringInvoice.update({
    where: { id, organizationId: user.organizationId },
    data: {
      clientId: data.clientId || null,
      title: data.title.trim(),
      frequency: data.frequency,
      nextRunDate: new Date(data.nextRunDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      active: data.active,
      issuerName: data.issuerName || "",
      issuerAddress: data.issuerAddress || "",
      clientName: data.clientName || "",
      clientAddress: data.clientAddress || "",
      clientEmail: data.clientEmail || null,
      notes: data.notes || null,
      vatActive: data.vatActive,
      vatRate: Number(data.vatRate) || 0,
      currency: data.currency,
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
    },
  });
}

export async function toggleRecurringInvoice(
  id: string,
  active: boolean,
): Promise<void> {
  const user = await requireDbUser();
  await prisma.recurringInvoice.update({
    where: { id, organizationId: user.organizationId },
    data: { active },
  });
}

export async function deleteRecurringInvoice(id: string): Promise<void> {
  const user = await requireDbUser();
  await prisma.recurringInvoice.deleteMany({
    where: { id, organizationId: user.organizationId },
  });
}

export async function generateInvoiceFromRecurring(recurringId: string) {
  const user = await requireDbUser();

  const recurring = await prisma.recurringInvoice.findFirst({
    where: { id: recurringId, organizationId: user.organizationId },
    include: { lines: true },
  });

  if (!recurring) throw new Error("Abonnement / Modèle introuvable");

  const year = new Date().getFullYear();
  const organization = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { invoiceCounter: { increment: 1 } },
    include: { companyProfile: true },
  });

  const invoiceNumber = `FAC-${year}-${String(organization.invoiceCounter).padStart(3, "0")}`;

  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const newInvoice = await prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      clientId: recurring.clientId,
      recurringInvoiceId: recurring.id,
      number: invoiceNumber,
      name: `${recurring.title} - ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
      issuerName: recurring.issuerName,
      issuerAddress: recurring.issuerAddress,
      clientName: recurring.clientName,
      clientAddress: recurring.clientAddress,
      clientEmail: recurring.clientEmail,
      notes: recurring.notes,
      invoiceDate: now,
      dueDate,
      vatActive: recurring.vatActive,
      vatRate: recurring.vatRate,
      status: "SENT",
      currency: recurring.currency,
      lines: {
        create: recurring.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      },
    },
  });

  // Calculer et enregistrer la prochaine date d'exécution
  const nextDate = computeNextDate(recurring.nextRunDate, recurring.frequency);
  const shouldDeactivate =
    recurring.endDate && nextDate.getTime() > new Date(recurring.endDate).getTime();

  await prisma.recurringInvoice.update({
    where: { id: recurring.id },
    data: {
      nextRunDate: nextDate,
      active: shouldDeactivate ? false : recurring.active,
    },
  });

  return newInvoice;
}
