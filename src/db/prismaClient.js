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

// Create a singleton instance of PrismaClient
const globalForPrisma = globalThis;

// Connection management configuration
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configure connection pool
    __internal: {
      engine: {
        connectionLimit: 5, // Limit connections per instance
      },
    },
  });

// Keep a single instance across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensure connections are properly closed on application shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Handle termination signals
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`${signal} received, closing Prisma connections...`);
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default prisma;
