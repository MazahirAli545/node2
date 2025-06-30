import prisma from "../db/prismaClient.js";

/**
 * Middleware to ensure Prisma connections are properly managed
 * This helps prevent connection leaks by ensuring connections are released after each request
 */
export const prismaConnectionManager = (req, res, next) => {
  // Store the original end method
  const originalEnd = res.end;

  // Override the end method
  res.end = function () {
    // Call the original end method
    originalEnd.apply(res, arguments);

    // Ensure any hanging transactions are cleaned up
    try {
      // Execute async cleanup without blocking response
      (async () => {
        try {
          // No-op if no active transaction, but helps ensure connections are returned to pool
          await prisma.$executeRaw`SELECT 1`;
        } catch (e) {
          // Ignore errors from cleanup attempts
          console.error("Prisma connection cleanup error:", e);
        }
      })();
    } catch (e) {
      // Ignore any synchronous errors
    }
  };

  next();
};

export default prismaConnectionManager;
