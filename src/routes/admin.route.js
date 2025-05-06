// routes/admin.route.js
import { Router } from "express";
import { generateUserOtp, verifyUserOtp } from "../controllers/admin/adminOTP.controller.js";
import { getAllUsers } from "../controllers/admin/getAllUsers.controller.js";


const router = Router();

router.get("/dashboard", (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard" });
});

// Admin routes OTP
router.post("/generate-otp", generateUserOtp);
router.post("/verify-otp", verifyUserOtp);

// Get all users
router.get("/users", getAllUsers)

export default router;
