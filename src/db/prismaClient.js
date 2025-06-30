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

// Explicit connection management
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_RETRY_DELAY = 500; // ms

// Connection management configuration with more restricted settings
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configure connection pool - reduce limits further
    __internal: {
      engine: {
        connectionLimit: 2, // Reduce to only 2 connections per instance
      },
    },
  });

// Helper function to connect with retry logic
const connectWithRetry = async () => {
  if (isConnected) return true;

  try {
    // Ensure any existing connections are closed first
    await prisma.$disconnect();

    // Test connection with a simple query
    await prisma.$executeRaw`SELECT 1`;

    isConnected = true;
    connectionAttempts = 0;
    return true;
  } catch (error) {
    connectionAttempts++;
    console.error(
      `Database connection attempt ${connectionAttempts} failed:`,
      error
    );

    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.error("Max connection attempts reached, giving up");
      return false;
    }

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, CONNECTION_RETRY_DELAY));
    return connectWithRetry();
  }
};

// Add connection state check to the prisma instance
prisma.$connect = async () => {
  return connectWithRetry();
};

// Extend the client to automatically handle connection issues
const originalQuery = prisma.$queryRaw.bind(prisma);
prisma.$queryRaw = async (...args) => {
  await connectWithRetry();
  return originalQuery(...args);
};

// Force close connections on idle to prevent connection leaks
setInterval(async () => {
  try {
    if (isConnected) {
      await prisma.$disconnect();
      isConnected = false;
    }
  } catch (e) {
    console.error("Error during automatic connection cleanup:", e);
  }
}, 60000); // Disconnect every minute if connected

// Keep a single instance across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensure connections are properly closed on application shutdown
process.on("beforeExit", async () => {
  if (isConnected) {
    await prisma.$disconnect();
    isConnected = false;
  }
});

// Handle termination signals
["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, async () => {
    console.log(`${signal} received, closing Prisma connections...`);
    if (isConnected) {
      await prisma.$disconnect();
      isConnected = false;
    }
    process.exit(0);
  });
});

export default prisma;
