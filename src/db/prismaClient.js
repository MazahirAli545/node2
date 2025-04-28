// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = globalThis; // Use globalThis to avoid issues in some environments

// let prisma;

// if (!globalForPrisma.prisma) {
//   globalForPrisma.prisma = new PrismaClient();
// }
// prisma = globalForPrisma.prisma;

// export default prisma;

// // const prisma = globalForPrisma.prisma || new PrismaClient();

// // if (process.env.NODE_ENV !== "production") {
// // globalForPrisma.prisma = prisma;
// // }

// // export default prisma;

//////////////////////////////////////////////////////////////////
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Only create ONE instance
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

const prisma = globalForPrisma.prisma;

export default prisma;
