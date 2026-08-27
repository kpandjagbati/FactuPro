"use server";

import prisma from "@/lib/prisma";
import type { Payment, PaymentInput } from "@/type";
import { auth } from "@clerk/nextjs/server";

async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: true,
    },
  });

  if (!user) throw new Error("Utilisateur introuvable. Rechargez la page.");
  return user;
}

export async function getInvoicePayments(invoiceId: string): Promise<Payment[]> {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    select: { id: true },
  });

  if (!invoice) throw new Error("Facture introuvable");

  return prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { paymentDate: "desc" },
  });
}

export async function addPayment(
  invoiceId: string,
  data: PaymentInput,
): Promise<Payment> {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: {
      lines: true,
      payments: true,
    },
  });

  if (!invoice) throw new Error("Facture introuvable");

  const newPayment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: Number(data.amount) || 0,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paymentMethod: data.paymentMethod || "Virement",
      reference: data.reference?.trim() || null,
      notes: data.notes?.trim() || null,
    },
  });

  // Calcul du total TTC et total payé
  const totalHT = invoice.lines.reduce(
    (acc, l) => acc + l.quantity * l.unitPrice,
    0,
  );
  const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0;
  const totalTTC = totalHT + totalVAT;

  const totalPaid =
    invoice.payments.reduce((acc, p) => acc + p.amount, 0) + newPayment.amount;

  // Si intégralement payé, passer le statut en PAID
  if (totalPaid >= totalTTC && invoice.status !== "PAID") {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "PAID" },
    });
  }

  return newPayment;
}

export async function deletePayment(
  paymentId: string,
  invoiceId: string,
): Promise<void> {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: {
      lines: true,
      payments: true,
    },
  });

  if (!invoice) throw new Error("Facture introuvable");

  await prisma.payment.deleteMany({
    where: { id: paymentId, invoiceId },
  });

  // Recalculer le total payé restant
  const totalHT = invoice.lines.reduce(
    (acc, l) => acc + l.quantity * l.unitPrice,
    0,
  );
  const totalVAT = invoice.vatActive ? totalHT * (invoice.vatRate / 100) : 0;
  const totalTTC = totalHT + totalVAT;

  const remainingPayments = invoice.payments.filter((p) => p.id !== paymentId);
  const totalPaid = remainingPayments.reduce((acc, p) => acc + p.amount, 0);

  // Si elle était PAID et qu'il reste un solde, repasser à SENT
  if (invoice.status === "PAID" && totalPaid < totalTTC) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    });
  }
}
