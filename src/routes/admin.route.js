import { Router } from "express";
import { generateUserOtp, verifyUserOtp } from "../controllers/admin/adminOTP.controller.js";
import { getAllUsers } from "../controllers/admin/getAllUsers.controller.js";
import { getCategories } from "../controllers/admin/category.controller.js";
import { createBusiness, deleteBusiness,  updateBusiness} from "../controllers/admin/adminBusiness.controller.js";
import { getTranslations } from "../controllers/admin/language.controller.js";


const router = Router();

router.get("/dashboard", (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard" });
});

// Admin routes OTP
router.post("/generate-otp", generateUserOtp);
router.post("/verify-otp", verifyUserOtp);

// Get all users
router.get("/users", getAllUsers)

// Get catogeries
router.get("/categories", getCategories)

// Business
router.post("/business", createBusiness)
router.put("/business/:id", updateBusiness)
router.delete("/business/:id", deleteBusiness)

// language routes
router.get("/language/:locale", getTranslations)

export default router;
