import prisma from "../db/prismaClient.js";

/**
 * Middleware to ensure Prisma connections are properly managed
 * This helps prevent connection leaks by ensuring connections are released after each request
 */
export const prismaConnectionManager = (req, res, next) => {
  // Track request timing
  const startTime = Date.now();
  let requestComplete = false;

  // Store the original end method
  const originalEnd = res.end;

  // Add request ID for tracking in logs
  const requestId = Math.random().toString(36).substring(2, 10);
  req.requestId = requestId;

  // Set a timeout to force disconnect if request takes too long
  const timeoutId = setTimeout(async () => {
    if (!requestComplete) {
      console.warn(
        `[${requestId}] Request taking too long, forcing connection cleanup`
      );
      try {
        await forceDatabaseCleanup();
      } catch (e) {
        console.error(`[${requestId}] Error during forced cleanup:`, e);
      }
    }
  }, 5000); // 5 seconds timeout

  // Override the end method
  res.end = function () {
    // Mark request as complete
    requestComplete = true;

    // Clear the timeout
    clearTimeout(timeoutId);

    // Log request duration
    const duration = Date.now() - startTime;
    if (duration > 1000) {
      console.warn(`[${requestId}] Long request detected: ${duration}ms`);
    }

    // Call the original end method
    originalEnd.apply(res, arguments);

    // Ensure any hanging transactions are cleaned up
    try {
      // Execute async cleanup without blocking response
      (async () => {
        try {
          await forceDatabaseCleanup();
        } catch (e) {
          // Ignore errors from cleanup attempts
          console.error(`[${requestId}] Prisma connection cleanup error:`, e);
        }
      })();
    } catch (e) {
      // Ignore any synchronous errors
      console.error(`[${requestId}] Synchronous error during cleanup:`, e);
    }
  };

  next();
};

/**
 * Utility function to force database connection cleanup
 */
const forceDatabaseCleanup = async () => {
  try {
    // Execute a simple query to ensure transaction is complete
    await prisma.$executeRaw`SELECT 1`;

    // Explicitly disconnect to release the connection
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error during forceDatabaseCleanup:", error);
    // Still try to disconnect even if the query failed
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Just log the error, nothing more we can do
      console.error("Error during disconnect attempt:", disconnectError);
    }
  }
};

export default prismaConnectionManager;
