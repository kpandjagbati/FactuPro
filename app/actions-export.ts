"use server";

import {
  buildClientsWorkbook,
  buildDashboardWorkbook,
  buildInvoicesWorkbook,
} from "@/lib/excel-export";
import prisma from "@/lib/prisma";
import { getDashboardStats } from "@/app/actions-v2";
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

  if (!user) throw new Error("Utilisateur introuvable.");
  return user;
}

function companyInfo(user: Awaited<ReturnType<typeof requireDbUser>>) {
  const profile = user.organization.companyProfile;
  return {
    name: profile?.name || user.organization.name,
    address: profile?.address || "",
    email: profile?.email,
    phone: profile?.phone,
  };
}

export async function exportInvoicesExcel() {
  const user = await requireDbUser();
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: user.organizationId },
    include: { lines: true },
    orderBy: { createdAt: "desc" },
  });
  return buildInvoicesWorkbook(
    invoices,
    companyInfo(user),
    user.organization.currency || "XOF",
  );
}

export async function exportClientsExcel() {
  const user = await requireDbUser();
  const clients = await prisma.client.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
  return buildClientsWorkbook(clients, companyInfo(user));
}

export async function exportDashboardExcel() {
  const user = await requireDbUser();
  const [stats, invoices] = await Promise.all([
    getDashboardStats(),
    prisma.invoice.findMany({
      where: { organizationId: user.organizationId },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return buildDashboardWorkbook(stats, invoices, companyInfo(user));
}
