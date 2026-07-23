"use server";

import { isPlatformAdminEmail } from "@/lib/admin";
import { formatMoney } from "@/lib/format";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

async function requirePlatformAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Non authentifié");

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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

export async function getAdminOverview() {
  await requirePlatformAdmin();

  const now = new Date();
  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);

  const [
    userCount,
    orgCount,
    invoiceCount,
    quoteCount,
    usersLast7,
    usersLast30,
    invoicesLast7,
    invoicesLast30,
    invoices,
    quotes,
    users,
    recentInvoices,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.invoice.count(),
    prisma.quote.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.invoice.count({ where: { createdAt: { gte: d7 } } }),
    prisma.invoice.count({ where: { createdAt: { gte: d30 } } }),
    prisma.invoice.findMany({
      include: { lines: true, organization: true },
    }),
    prisma.quote.findMany({ select: { status: true, createdAt: true } }),
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
  let overdueTotal = 0;
  let pendingTotal = 0;
  let draftCount = 0;
  let sentCount = 0;
  let paidCount = 0;
  let overdueCount = 0;
  let cancelledCount = 0;

  const orgTotals = new Map<
    string,
    { name: string; invoiceCount: number; revenue: number }
  >();

  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  const invoicesByMonth: Record<string, number> = Object.fromEntries(
    months.map((m) => [m, 0]),
  );
  const revenueByMonth: Record<string, number> = Object.fromEntries(
    months.map((m) => [m, 0]),
  );
  const signupsByMonth: Record<string, number> = Object.fromEntries(
    months.map((m) => [m, 0]),
  );

  for (const invoice of invoices) {
    const ttc = calcTotal(invoice.lines, invoice.vatActive, invoice.vatRate);
    const key = monthKey(invoice.createdAt);
    if (key in invoicesByMonth) {
      invoicesByMonth[key] += 1;
      if (invoice.status === "PAID") revenueByMonth[key] += ttc;
    }

    if (invoice.status === "PAID") {
      paidTotal += ttc;
      paidCount += 1;
    }
    if (invoice.status === "OVERDUE") {
      overdueCount += 1;
      overdueTotal += ttc;
    }
    if (invoice.status === "SENT") {
      sentCount += 1;
      pendingTotal += ttc;
    }
    if (invoice.status === "DRAFT") draftCount += 1;
    if (invoice.status === "CANCELLED") cancelledCount += 1;

    const org = orgTotals.get(invoice.organizationId) || {
      name: invoice.organization.name,
      invoiceCount: 0,
      revenue: 0,
    };
    org.invoiceCount += 1;
    if (invoice.status === "PAID") org.revenue += ttc;
    orgTotals.set(invoice.organizationId, org);
  }

  for (const u of await prisma.user.findMany({
    select: { createdAt: true },
  })) {
    const key = monthKey(u.createdAt);
    if (key in signupsByMonth) signupsByMonth[key] += 1;
  }

  const quotesConverted = quotes.filter((q) => q.status === "CONVERTED").length;
  const quoteConversionRate =
    quoteCount > 0 ? Math.round((quotesConverted / quoteCount) * 100) : 0;

  const statusBreakdown = [
    { key: "DRAFT", label: "Brouillon", count: draftCount, color: "neutral" },
    { key: "SENT", label: "En attente", count: sentCount, color: "warning" },
    { key: "PAID", label: "Payée", count: paidCount, color: "success" },
    { key: "OVERDUE", label: "Impayée", count: overdueCount, color: "error" },
    {
      key: "CANCELLED",
      label: "Annulée",
      count: cancelledCount,
      color: "ghost",
    },
  ].map((s) => ({
    ...s,
    percent:
      invoiceCount > 0 ? Math.round((s.count / invoiceCount) * 100) : 0,
  }));

  const monthlyActivity = months.map((key) => ({
    key,
    label: monthLabel(key),
    invoices: invoicesByMonth[key],
    revenue: revenueByMonth[key],
    revenueLabel: formatMoney(revenueByMonth[key], "XOF"),
    signups: signupsByMonth[key],
  }));

  const maxMonthlyInvoices = Math.max(
    1,
    ...monthlyActivity.map((m) => m.invoices),
  );
  const maxMonthlySignups = Math.max(
    1,
    ...monthlyActivity.map((m) => m.signups),
  );

  const topOrganizations = [...orgTotals.values()]
    .sort((a, b) => b.revenue - a.revenue || b.invoiceCount - a.invoiceCount)
    .slice(0, 5)
    .map((o) => ({
      name: o.name,
      invoiceCount: o.invoiceCount,
      revenueLabel: formatMoney(o.revenue, "XOF"),
    }));

  return {
    userCount,
    orgCount,
    invoiceCount,
    quoteCount,
    paidTotal,
    overdueCount,
    overdueTotal,
    pendingTotal,
    draftCount,
    sentCount,
    paidCount,
    cancelledCount,
    paidTotalLabel: formatMoney(paidTotal, "XOF"),
    overdueTotalLabel: formatMoney(overdueTotal, "XOF"),
    pendingTotalLabel: formatMoney(pendingTotal, "XOF"),
    usersLast7,
    usersLast30,
    invoicesLast7,
    invoicesLast30,
    quotesConverted,
    quoteConversionRate,
    statusBreakdown,
    monthlyActivity,
    maxMonthlyInvoices,
    maxMonthlySignups,
    topOrganizations,
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
