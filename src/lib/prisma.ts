// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"], // You can use ['query', 'info', 'warn', 'error'] for more debugging
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
