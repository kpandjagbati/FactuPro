"use server";

import { isPlatformAdminEmail } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { auth, currentUser } from "@clerk/nextjs/server";

async function requirePlatformAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Non authentifié");
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;

  if (!isPlatformAdminEmail(email)) {
    throw new Error("Accès admin refusé");
  }

  return { userId, email: email! };
}

function calcTotal(
  lines: { quantity: number; unitPrice: number }[],
  vatActive: boolean,
  vatRate: number,
) {
  const ht = lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  const vat = vatActive ? ht * (vatRate / 100) : 0;
  return ht + vat;
}

export async function getAdminOverview() {
  await requirePlatformAdmin();

  const [userCount, orgCount, invoiceCount, quoteCount, invoices, users, recentInvoices] =
    await Promise.all([
      prisma.user.count(),
      prisma.organization.count(),
      prisma.invoice.count(),
      prisma.quote.count(),
      prisma.invoice.findMany({
        include: { lines: true },
      }),
      prisma.user.findMany({
        include: { organization: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.invoice.findMany({
        include: { lines: true, organization: true },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

  let paidTotal = 0;
  let overdueCount = 0;
  let draftCount = 0;
  let sentCount = 0;

  for (const invoice of invoices) {
    const ttc = calcTotal(invoice.lines, invoice.vatActive, invoice.vatRate);
    if (invoice.status === "PAID") paidTotal += ttc;
    if (invoice.status === "OVERDUE") overdueCount += 1;
    if (invoice.status === "DRAFT") draftCount += 1;
    if (invoice.status === "SENT") sentCount += 1;
  }

  return {
    userCount,
    orgCount,
    invoiceCount,
    quoteCount,
    paidTotal,
    overdueCount,
    draftCount,
    sentCount,
    paidTotalLabel: formatMoney(paidTotal, "XOF"),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      organization: u.organization.name,
      createdAt: u.createdAt.toISOString(),
    })),
    recentInvoices: recentInvoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      name: inv.name,
      status: inv.status,
      organization: inv.organization.name,
      total: formatMoney(
        calcTotal(inv.lines, inv.vatActive, inv.vatRate),
        inv.currency,
      ),
      createdAt: inv.createdAt.toISOString(),
    })),
  };
}

export async function isCurrentUserPlatformAdmin() {
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  return isPlatformAdminEmail(email);
}
