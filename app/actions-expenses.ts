"use server";

import prisma from "@/lib/prisma";
import type { Expense, ExpenseInput } from "@/type";
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

export async function getExpenses(): Promise<Expense[]> {
  const user = await requireDbUser();
  return prisma.expense.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { expenseDate: "desc" },
  });
}

export async function createExpense(data: ExpenseInput): Promise<Expense> {
  const user = await requireDbUser();
  return prisma.expense.create({
    data: {
      organizationId: user.organizationId,
      title: data.title.trim(),
      amount: Number(data.amount) || 0,
      category: data.category || "Autre",
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      receiptUrl: data.receiptUrl || null,
      notes: data.notes?.trim() || null,
    },
  });
}

export async function updateExpense(
  id: string,
  data: ExpenseInput,
): Promise<Expense> {
  const user = await requireDbUser();
  return prisma.expense.update({
    where: { id, organizationId: user.organizationId },
    data: {
      title: data.title.trim(),
      amount: Number(data.amount) || 0,
      category: data.category || "Autre",
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
      receiptUrl: data.receiptUrl || null,
      notes: data.notes?.trim() || null,
    },
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const user = await requireDbUser();
  await prisma.expense.deleteMany({
    where: { id, organizationId: user.organizationId },
  });
}
