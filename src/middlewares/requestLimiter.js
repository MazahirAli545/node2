/**
 * Middleware to limit the number of concurrent requests
 * This helps prevent database connection exhaustion
 */

// Maximum number of concurrent requests allowed
const MAX_CONCURRENT_REQUESTS = 40; // Set lower than the database max connections (75)

// Current count of active requests
let activeRequests = 0;

// Queue for requests that exceed the limit
const requestQueue = [];

// Request limiter middleware
export const requestLimiter = (req, res, next) => {
  // If we're under the limit, process immediately
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;

    // Add a hook to cleanup when the response is sent
    const cleanup = () => {
      activeRequests--;

      // If there are requests in the queue and we're now under the limit, process the next one
      if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
        const nextRequest = requestQueue.shift();
        activeRequests++;
        nextRequest.next();
      }
    };

    // Handle response finish and errors
    res.on("finish", cleanup);
    res.on("error", cleanup);
    res.on("close", cleanup);

    // Continue to the next middleware
    next();
  } else {
    // If we're at the limit, queue the request
    console.warn(
      `Request queued: Active requests limit (${MAX_CONCURRENT_REQUESTS}) reached. Queue size: ${
        requestQueue.length + 1
      }`
    );

    // Add request to queue with a timeout
    const queueTimeout = setTimeout(() => {
      // Remove from queue if timed out
      const index = requestQueue.findIndex((item) => item.req === req);
      if (index !== -1) {
        requestQueue.splice(index, 1);

        // Send a 503 Service Unavailable response
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message:
              "Server is currently processing too many requests. Please try again later.",
          });
        }
      }
    }, 10000); // 10 second timeout

    // Queue the request
    requestQueue.push({
      req,
      next: () => {
        clearTimeout(queueTimeout);

        // Handle response finish and errors
        res.on("finish", () => {
          activeRequests--;

          // Process next request in queue if any
          if (
            requestQueue.length > 0 &&
            activeRequests < MAX_CONCURRENT_REQUESTS
          ) {
            const nextRequest = requestQueue.shift();
            activeRequests++;
            nextRequest.next();
          }
        });

        res.on("error", () => {
          activeRequests--;

          // Process next request in queue if any
          if (
            requestQueue.length > 0 &&
            activeRequests < MAX_CONCURRENT_REQUESTS
          ) {
            const nextRequest = requestQueue.shift();
            activeRequests++;
            nextRequest.next();
          }
        });

        res.on("close", () => {
          activeRequests--;

          // Process next request in queue if any
          if (
            requestQueue.length > 0 &&
            activeRequests < MAX_CONCURRENT_REQUESTS
          ) {
            const nextRequest = requestQueue.shift();
            activeRequests++;
            nextRequest.next();
          }
        });

        // Continue to the next middleware
        next();
      },
    });
  }
};

export default requestLimiter;
