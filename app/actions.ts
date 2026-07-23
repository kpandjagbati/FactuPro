"use server";

import prisma from "@/lib/prisma";
import type { ClientInput, CompanyProfileInput, Invoice } from "@/type";
import type { InvoiceStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Non authentifié");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      organization: {
        include: { companyProfile: true },
      },
    },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable. Rechargez la page.");
  }

  return user;
}

export async function checkAndAddUser(
  clerkId: string,
  email: string,
  name: string,
) {
  if (!clerkId || !email) return;

  // Les comptes admin n'ont pas d'organisation / parcours user
  const { isPlatformAdminEmail } = await import("@/lib/admin");
  if (isPlatformAdminEmail(email)) return;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) return existingUser;

    const organization = await prisma.organization.create({
      data: {
        name: name || "Mon entreprise",
        currency: "XOF",
        companyProfile: {
          create: {
            name: name || "",
          },
        },
      },
    });

    return await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        organizationId: organization.id,
      },
    });
  } catch (error) {
    console.error("checkAndAddUser:", error);
  }
}

export async function getCurrentUser(clerkId: string) {
  if (!clerkId) return null;

  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      organization: {
        include: {
          companyProfile: true,
        },
      },
    },
  });
}

export async function getCompanyProfile() {
  const user = await requireDbUser();
  return (
    user.organization.companyProfile ??
    (await prisma.companyProfile.create({
      data: {
        organizationId: user.organizationId,
        name: user.organization.name,
      },
    }))
  );
}

export async function updateCompanyProfile(data: CompanyProfileInput) {
  const user = await requireDbUser();

  const profile = await prisma.companyProfile.upsert({
    where: { organizationId: user.organizationId },
    update: {
      name: data.name,
      address: data.address,
      email: data.email || null,
      phone: data.phone || null,
      taxId: data.taxId || null,
      iban: data.iban || null,
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
    },
    create: {
      organizationId: user.organizationId,
      name: data.name,
      address: data.address,
      email: data.email || null,
      phone: data.phone || null,
      taxId: data.taxId || null,
      iban: data.iban || null,
      logoUrl: data.logoUrl || null,
    },
  });

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { name: data.name || user.organization.name },
  });

  return profile;
}

export async function getClients() {
  const user = await requireDbUser();
  return prisma.client.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createClient(data: ClientInput) {
  const user = await requireDbUser();

  if (!data.name.trim()) {
    throw new Error("Le nom du client est requis");
  }

  return prisma.client.create({
    data: {
      organizationId: user.organizationId,
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || "",
      taxId: data.taxId || null,
    },
  });
}

export async function updateClient(clientId: string, data: ClientInput) {
  const user = await requireDbUser();

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: user.organizationId },
  });

  if (!existing) {
    throw new Error("Client introuvable");
  }

  return prisma.client.update({
    where: { id: clientId },
    data: {
      name: data.name.trim(),
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || "",
      taxId: data.taxId || null,
    },
  });
}

export async function deleteClient(clientId: string) {
  const user = await requireDbUser();

  const existing = await prisma.client.findFirst({
    where: { id: clientId, organizationId: user.organizationId },
  });

  if (!existing) {
    throw new Error("Client introuvable");
  }

  await prisma.client.delete({ where: { id: clientId } });
}

export async function getInvoices() {
  const user = await requireDbUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Une seule requête au lieu d'un update par facture
  await prisma.invoice.updateMany({
    where: {
      organizationId: user.organizationId,
      status: "SENT",
      dueDate: { lt: today },
    },
    data: { status: "OVERDUE" },
  });

  return prisma.invoice.findMany({
    where: { organizationId: user.organizationId },
    include: { lines: true, client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEmptyInvoice(name: string) {
  const user = await requireDbUser();
  const trimmed = name.trim();

  if (!trimmed || trimmed.length > 60) {
    throw new Error("Nom de facture invalide");
  }

  const year = new Date().getFullYear();
  const organization = await prisma.organization.update({
    where: { id: user.organizationId },
    data: { invoiceCounter: { increment: 1 } },
    include: { companyProfile: true },
  });

  const number = `FAC-${year}-${String(organization.invoiceCounter).padStart(4, "0")}`;
  const profile = organization.companyProfile;

  return prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      number,
      name: trimmed,
      currency: organization.currency || "XOF",
      issuerName: profile?.name || "",
      issuerAddress: profile?.address || "",
      invoiceDate: new Date(),
      vatRate: 18,
      vatActive: false,
      status: "DRAFT",
    },
    include: { lines: true },
  });
}

export async function getInvoiceById(invoiceId: string) {
  const user = await requireDbUser();

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: user.organizationId,
    },
    include: { lines: true, client: true },
  });

  if (!invoice) {
    throw new Error("Facture non trouvée");
  }

  return invoice;
}

export async function updateInvoice(invoice: Invoice) {
  const user = await requireDbUser();

  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoice.id,
      organizationId: user.organizationId,
    },
    include: { lines: true },
  });

  if (!existingInvoice) {
    throw new Error(`Facture ${invoice.id} introuvable`);
  }

  const invoiceDate =
    typeof invoice.invoiceDate === "string"
      ? new Date(invoice.invoiceDate)
      : invoice.invoiceDate;
  const dueDate =
    typeof invoice.dueDate === "string"
      ? new Date(invoice.dueDate)
      : invoice.dueDate;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      name: invoice.name,
      issuerName: invoice.issuerName,
      issuerAddress: invoice.issuerAddress,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress,
      clientEmail: invoice.clientEmail || null,
      clientId: invoice.clientId || null,
      invoiceDate: invoiceDate && !Number.isNaN(invoiceDate.getTime()) ? invoiceDate : null,
      dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null,
      vatActive: invoice.vatActive,
      vatRate: invoice.vatRate,
      status: invoice.status as InvoiceStatus,
      currency: invoice.currency || "XOF",
    },
  });

  const existingLines = existingInvoice.lines;
  const receivedLines = invoice.lines;

  const linesToDelete = existingLines.filter(
    (existingLine) => !receivedLines.some((line) => line.id === existingLine.id),
  );

  if (linesToDelete.length > 0) {
    await prisma.invoiceLine.deleteMany({
      where: { id: { in: linesToDelete.map((line) => line.id) } },
    });
  }

  for (const line of receivedLines) {
    const existingLine = existingLines.find((l) => l.id === line.id);

    if (existingLine) {
      const hasChanged =
        line.description !== existingLine.description ||
        line.quantity !== existingLine.quantity ||
        line.unitPrice !== existingLine.unitPrice;

      if (hasChanged) {
        await prisma.invoiceLine.update({
          where: { id: line.id },
          data: {
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          },
        });
      }
    } else {
      await prisma.invoiceLine.create({
        data: {
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          invoiceId: invoice.id,
        },
      });
    }
  }

  return getInvoiceById(invoice.id);
}

export async function deleteInvoice(invoiceId: string) {
  const user = await requireDbUser();

  const existing = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId: user.organizationId,
    },
  });

  if (!existing) {
    throw new Error("Facture introuvable");
  }

  await prisma.invoice.delete({ where: { id: invoiceId } });
}

export async function applyClientToInvoice(invoiceId: string, clientId: string) {
  const user = await requireDbUser();

  const [invoice, client] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId: user.organizationId },
    }),
    prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
    }),
  ]);

  if (!invoice || !client) {
    throw new Error("Facture ou client introuvable");
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      clientId: client.id,
      clientName: client.name,
      clientAddress: client.address || "",
    },
    include: { lines: true, client: true },
  });
}
