import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import pkg from "twilio/lib/twiml/MessagingResponse.js";
import cors from "cors";
import { fcmRoutes } from "./routes/fcm.route.js";

const { Message } = pkg;

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] })); // Adjust origin as needed

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
app.use("/api", fcmRoutes);

// console.log("232", userRouter);

app.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
