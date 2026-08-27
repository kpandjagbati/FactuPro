"use server";

import prisma from "@/lib/prisma";
import type { Product, ProductInput } from "@/type";
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

export async function getProducts(): Promise<Product[]> {
  const user = await requireDbUser();
  return prisma.product.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  const user = await requireDbUser();
  return prisma.product.findFirst({
    where: { id, organizationId: user.organizationId },
  });
}

export async function createProduct(data: ProductInput): Promise<Product> {
  const user = await requireDbUser();
  return prisma.product.create({
    data: {
      organizationId: user.organizationId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      unitPrice: Number(data.unitPrice) || 0,
      unit: data.unit?.trim() || "unité",
      category: data.category?.trim() || null,
    },
  });
}

export async function updateProduct(
  id: string,
  data: ProductInput,
): Promise<Product> {
  const user = await requireDbUser();
  return prisma.product.update({
    where: { id, organizationId: user.organizationId },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      unitPrice: Number(data.unitPrice) || 0,
      unit: data.unit?.trim() || "unité",
      category: data.category?.trim() || null,
    },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const user = await requireDbUser();
  await prisma.product.deleteMany({
    where: { id, organizationId: user.organizationId },
  });
}
