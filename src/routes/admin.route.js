import { Router } from "express";
import {
  generateUserOtp,
  verifyUserOtp,
} from "../controllers/admin/adminOTP.controller.js";
import { deleteUser, getAllUsers, getUserByPrId, getUserProfile } from "../controllers/admin/getAllUsers.controller.js";
import { getCategories } from "../controllers/admin/category.controller.js";
import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from "../controllers/admin/adminBusiness.controller.js";
// import { getTranslations } from "../controllers/admin/language.controller.js";
import {
  getAllPages,
  getPageById,
  updatePageById,
  deletePageById,
  addPage,
} from "../controllers/admin/page.controller.js";
import {
  createContentSection,
  deleteContentSection,
  getAllContentSections,
  updateContentSection,
} from "../controllers/admin/contentSection.controller.js";
import {
  deleteContentSectionLang,
  getAllContentSectionsLang,
  getContentSectionLangById,
  updateContentSectionLang,
} from "../controllers/admin/contentLang.controller.js";

const router = Router();

router.get("/dashboard", (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard" });
});

// Admin routes OTP
router.post("/generate-otp", generateUserOtp);
router.post("/verify-otp", verifyUserOtp);

// Get all users
router.get("/users", getAllUsers);
router.get("/users/:prId", getUserByPrId)
router.get("/users/uniqueid/:uniqueID", getUserProfile)
router.delete("/users/:prId", deleteUser)

// Get catogeries
router.get("/categories", getCategories);

// Business
router.post("/business", createBusiness);
router.put("/business/:id", updateBusiness);
router.delete("/business/:id", deleteBusiness);

// language routes
// router.get("/language/:locale", getTranslations)

// Pages
router.get("/pages", getAllPages);
router.post("/pages", addPage);
router.get("/pages/:id", getPageById);
router.put("/pages/:id", updatePageById);
router.delete("/pages/:id", deletePageById);

// Content
router.get("/content", getAllContentSections);
router.post("/content", createContentSection);
router.put("/content/:id", updateContentSection);
router.delete("/content/:id", deleteContentSection);

// Content lang
router.get("/lang", getAllContentSectionsLang);
router.get("/lang/:id/:lang_code", getContentSectionLangById);
router.put("/lang/:id/:lang_code", updateContentSectionLang)
router.delete("/lang/:id/:lang_code", deleteContentSectionLang)

export default router;
