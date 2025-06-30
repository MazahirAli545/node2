import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import pkg from "twilio/lib/twiml/MessagingResponse.js";
import cors from "cors";
import { fcmRoutes } from "./routes/fcm.route.js";
import prismaConnectionManager from "./middlewares/prismaConnectionManager.js";

const { Message } = pkg;

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] })); // Adjust origin as needed

// Apply Prisma connection manager middleware to all routes
app.use(prismaConnectionManager);

dotenv.config();

app.get("/", (req, res) => {
  res.json({ message: "hello world " });
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
