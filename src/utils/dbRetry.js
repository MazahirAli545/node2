/**
 * Utility function to retry database operations with exponential backoff
 * Useful for handling transient connection issues like max_user_connections
 *
 * @param {Function} operation - The database operation to retry (should return a Promise)
 * @param {Object} options - Options for retry behavior
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 5)
 * @param {number} options.initialDelay - Initial delay in ms before first retry (default: 50)
 * @param {number} options.maxDelay - Maximum delay in ms between retries (default: 500)
 * @returns {Promise} - Result of the database operation
 */
export const withRetry = async (operation, options = {}) => {
  const { maxRetries = 5, initialDelay = 50, maxDelay = 500 } = options;

  let lastError;
  let delay = initialDelay;

  // Generate operation ID for logging
  const operationId = Math.random().toString(36).substring(2, 8);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Before each attempt, make sure we have a fresh connection
      if (attempt > 0) {
        try {
          // Try to disconnect before retrying to ensure a fresh connection
          await import("../db/prismaClient.js").then((module) =>
            module.default.$disconnect()
          );

          // Small delay after disconnect
          await new Promise((resolve) => setTimeout(resolve, 20));
        } catch (disconnectError) {
          console.warn(
            `[${operationId}] Failed to disconnect before retry: ${disconnectError.message}`
          );
        }
      }

      // Attempt the operation
      const result = await operation();

      // If this was a retry, log success
      if (attempt > 0) {
        console.log(
          `[${operationId}] Operation succeeded after ${attempt} retries`
        );
      }

      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry based on error type
      const shouldRetry =
        error.message?.includes("max_user_connections") ||
        error.message?.includes("connect ETIMEDOUT") ||
        error.message?.includes("Connection lost") ||
        error.code === "P1001" || // Prisma can't reach database
        error.code === "P1002" || // Database connection timed out
        error.code === "P1008" || // Operations timeout
        error.code === "P1011" || // Error opening a TLS connection
        error.code === "P1012" || // Validation error
        error.code === "P1013" || // Error parsing engine response
        error.code === "P1017"; // Connection lost

      // If we shouldn't retry or we've reached max retries, throw the error
      if (!shouldRetry || attempt >= maxRetries) {
        console.error(
          `[${operationId}] Database operation failed permanently after ${attempt} attempts:`,
          error
        );
        throw error;
      }

      // Log the retry attempt
      console.warn(
        `[${operationId}] Database operation failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }), retrying in ${delay}ms:`,
        error.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with jitter
      delay = Math.min(delay * 1.5, maxDelay) * (0.8 + Math.random() * 0.4);
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError;
};

/**
 * Wrap a database operation with a connection pool management strategy
 * This ensures the operation gets a fair chance at getting a connection
 */
export const withConnectionManagement = async (operation) => {
  const prisma = (await import("../db/prismaClient.js")).default;

  try {
    // First try with normal operation
    return await withRetry(operation);
  } catch (error) {
    if (error.message?.includes("max_user_connections")) {
      console.warn("Hit connection limit, trying aggressive strategy...");

      // Force disconnect to free up connections
      try {
        await prisma.$disconnect();
        // Wait a bit to allow connections to be properly released
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        // Ignore disconnect errors
      }

      // Try one more time with higher retry count
      return await withRetry(operation, {
        maxRetries: 8,
        initialDelay: 100,
      });
    }

    // For other errors, just rethrow
    throw error;
  }
};

export default withConnectionManagement;
