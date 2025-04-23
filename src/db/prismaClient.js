import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis; // Use globalThis to avoid issues in some environments

const prisma = globalForPrisma.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") {

// }

globalForPrisma.prisma = prisma;
export default prisma;
