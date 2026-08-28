"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: {
          companyProfile: true,
        },
      },
    },
  });

  if (!user) throw new Error("Utilisateur introuvable");
  return user;
}

export async function generateDeliveryNote(invoiceId: string) {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: { lines: true, client: true },
  });

  if (!invoice) throw new Error("Facture introuvable");

  if (!invoice.deliveryNumber) {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        organizationId: user.organizationId,
        deliveryNumber: { not: null },
      },
    });

    const deliveryNumber = `BL-${year}-${String(count + 1).padStart(4, "0")}`;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        deliveryNumber,
        deliveryDate: new Date(),
      },
    });

    return { deliveryNumber, deliveryDate: new Date() };
  }

  return {
    deliveryNumber: invoice.deliveryNumber,
    deliveryDate: invoice.deliveryDate || new Date(),
  };
}

export async function getDeliveryNoteData(invoiceId: string) {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: {
      lines: true,
      client: true,
      organization: {
        include: {
          companyProfile: true,
        },
      },
    },
  });

  if (!invoice) throw new Error("Facture introuvable");
  return invoice;
}
