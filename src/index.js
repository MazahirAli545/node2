import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import pkg from "twilio/lib/twiml/MessagingResponse.js";
import cors from "cors";
import { fcmRoutes } from "./routes/fcm.route.js";
import prismaConnectionManager from "./middlewares/prismaConnectionManager.js";
import requestLimiter from "./middlewares/requestLimiter.js";

const { Message } = pkg;

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] })); // Adjust origin as needed

// Apply request limiter first to prevent too many concurrent requests
app.use(requestLimiter);

// Apply Prisma connection manager middleware to all routes
app.use(prismaConnectionManager);

dotenv.config();

// Add middleware to measure and log request times
app.use((req, res, next) => {
  const start = Date.now();

  // Override end method to measure response time
  const originalEnd = res.end;
  res.end = function () {
    const duration = Date.now() - start;
    if (duration > 500) {
      // Log slow requests (over 500ms)
      console.warn(
        `SLOW REQUEST: ${req.method} ${req.originalUrl} took ${duration}ms`
      );
    }
    originalEnd.apply(res, arguments);
  };

  next();
});

app.get("/", (req, res) => {
  res.json({ message: "hello world " });
});

// Add a health check endpoint that doesn't use the database
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

const PORT = process.env.PORT || 3000;

// User route
app.use("/api/user", userRouter);

// Admin route
app.use("/api/admin", adminRouter);

// FCM route
app.use("/api/fcm", fcmRoutes);

// Global error handler to ensure connection cleanup on errors
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
