/**
 * Utility function to retry database operations with exponential backoff
 * Useful for handling transient connection issues like max_user_connections
 *
 * @param {Function} operation - The database operation to retry (should return a Promise)
 * @param {Object} options - Options for retry behavior
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms before first retry (default: 100)
 * @param {number} options.maxDelay - Maximum delay in ms between retries (default: 1000)
 * @returns {Promise} - Result of the database operation
 */
export const withRetry = async (operation, options = {}) => {
  const { maxRetries = 3, initialDelay = 100, maxDelay = 1000 } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry based on error type
      const shouldRetry =
        error.message?.includes("max_user_connections") ||
        error.code === "P1001" || // Prisma can't reach database
        error.code === "P1008" || // Operations timeout
        error.code === "P1017"; // Connection lost

      // If we shouldn't retry or we've reached max retries, throw the error
      if (!shouldRetry || attempt >= maxRetries) {
        throw error;
      }

      // Log the retry attempt
      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${
          maxRetries + 1
        }), retrying in ${delay}ms:`,
        error.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff with jitter
      delay = Math.min(delay * 2, maxDelay) * (0.8 + Math.random() * 0.4);
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError;
};

export default withRetry;
