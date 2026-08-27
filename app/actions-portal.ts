"use server";

import prisma from "@/lib/prisma";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";

function generatePublicToken() {
  return crypto.randomBytes(16).toString("hex");
}

export async function ensureInvoicePublicToken(invoiceId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, publicToken: true },
  });

  if (!invoice) throw new Error("Facture introuvable");

  if (invoice.publicToken) {
    return invoice.publicToken;
  }

  const token = generatePublicToken();
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { publicToken: token },
  });

  return token;
}

export async function ensureQuotePublicToken(quoteId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, publicToken: true },
  });

  if (!quote) throw new Error("Devis introuvable");

  if (quote.publicToken) {
    return quote.publicToken;
  }

  const token = generatePublicToken();
  await prisma.quote.update({
    where: { id: quoteId },
    data: { publicToken: token },
  });

  return token;
}

export async function getPublicInvoice(publicToken: string) {
  if (!publicToken) return null;

  const invoice = await prisma.invoice.findUnique({
    where: { publicToken },
    include: {
      lines: true,
      client: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
      organization: {
        include: {
          companyProfile: true,
        },
      },
    },
  });

  if (!invoice) return null;

  // Enregistrer la date de première consultation par le client
  if (!invoice.viewedAt) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { viewedAt: new Date() },
    });
  }

  return invoice;
}

export async function getPublicQuote(publicToken: string) {
  if (!publicToken) return null;

  const quote = await prisma.quote.findUnique({
    where: { publicToken },
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

  if (!quote) return null;

  // Enregistrer la consultation si pas encore fait
  if (!quote.viewedAt) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { viewedAt: new Date() },
    });
  }

  return quote;
}

export async function signQuotePublic(params: {
  publicToken: string;
  signerName: string;
  signatureData: string;
}) {
  const { publicToken, signerName, signatureData } = params;
  if (!publicToken || !signerName.trim() || !signatureData) {
    throw new Error("Veuillez fournir votre nom et votre signature.");
  }

  const quote = await prisma.quote.findUnique({
    where: { publicToken },
  });

  if (!quote) throw new Error("Devis introuvable.");
  if (quote.status === "ACCEPTED" || quote.status === "CONVERTED") {
    throw new Error("Ce devis a déjà été validé.");
  }

  return prisma.quote.update({
    where: { publicToken },
    data: {
      status: "ACCEPTED",
      signedAt: new Date(),
      signedByName: signerName.trim(),
      signatureData,
    },
  });
}

export async function rejectQuotePublic(params: {
  publicToken: string;
  reason?: string;
}) {
  const { publicToken } = params;
  if (!publicToken) throw new Error("Devis introuvable.");

  const quote = await prisma.quote.findUnique({
    where: { publicToken },
  });

  if (!quote) throw new Error("Devis introuvable.");

  return prisma.quote.update({
    where: { publicToken },
    data: {
      status: "REJECTED",
    },
  });
}
