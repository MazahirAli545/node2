import { Router } from "express";
import {
  generateUserOtp,
  verifyUserOtp,
} from "../controllers/admin/adminOTP.controller.js";
import {
  deleteUser,
  getAllUsers,
  getUserByPrId,
  getUserProfile,
} from "../controllers/admin/getAllUsers.controller.js";
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
  getPageByLinkUrl,
} from "../controllers/admin/page.controller.js";
import {
  getAllContentSections,
  getContentSectionById,
  createContentSection,
  updateContentSection,
  deleteContentSection,
} from "../controllers/admin/contentSection.controller.js";
import {
  getAllContentSectionsLang,
  getContentSectionLangById,
  createContentSectionLang,
  updateContentSectionLang,
  deleteContentSectionLang,
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
router.get("/users/:prId", getUserByPrId);
router.get("/users/uniqueid/:uniqueID", getUserProfile);
router.delete("/users/:prId", deleteUser);

// Get catogeries
router.get("/categories", getCategories);

// Business
router.post("/business", createBusiness);
router.put("/business/:id", updateBusiness);
router.delete("/business/:id", deleteBusiness);

// language routes
// router.get("/language/:locale", getTranslations)

// Pages
// Public API for fetching page content by link_url (including multilingual content)
// Route for root path with language code
router.get("/v1/pages/:lang_code", getPageByLinkUrl); // For root path like /en or /hi
// Route for all other paths with language code
router.get("/v1/pages/:lang_code/:link_url(*)", getPageByLinkUrl); // For paths like /en/about, /hi/contact, etc.

// Admin API for managing pages by ID (existing functions)
router.get("/v1/pages", getAllPages); // Get all pages (e.g., for admin list)
router.post("/v1/pages", addPage); // Add a new page
router.get("/v1/pages/id/:id", getPageById); // Get page by numeric ID (renamed to avoid conflict)
router.put("/v1/pages/id/:id", updatePageById); // Update page by numeric ID (renamed to avoid conflict)
router.delete("/v1/pages/id/:id", deletePageById); // Delete page by numeric ID (renamed to avoid conflict)

// Content
// Routes for content_sections (default/English content blocks)
router.get("/v1/content-sections", getAllContentSections); // GET /api/v1/content-sections?page_id=X&active_yn=1
router.post("/v1/content-sections", createContentSection); // POST /api/v1/content-sections
router.get("/v1/content-sections/:id", getContentSectionById); // GET /api/v1/content-sections/:id (with translations)
router.put("/v1/content-sections/:id", updateContentSection); // PUT /api/v1/content-sections/:id
router.delete("/v1/content-sections/:id", deleteContentSection); // DELETE /api/v1/content-sections/:id

// Content lang
// Routes for content_sections_lang (multilingual content translations)
// Routes for content_sections_lang (multilingual content translations)
// GET all translations (can filter by parent ID and/or lang_code, excludes 'en' by default)
router.get("/v1/content-sections-lang", getAllContentSectionsLang);

// POST create a new translation (id and lang_code in body for composite PK)
router.post("/v1/content-sections-lang", createContentSectionLang);

// GET a specific translation by its composite primary key (id and lang_code in URL)
router.get(
  "/v1/content-sections-lang/:id/:lang_code",
  getContentSectionLangById
);

// PUT update a specific translation by its composite primary key (id and lang_code in URL)
router.put(
  "/v1/content-sections-lang/:id/:lang_code",
  updateContentSectionLang
);

// DELETE a specific translation by its composite primary key (id and lang_code in URL)
router.delete(
  "/v1/content-sections-lang/:id/:lang_code",
  deleteContentSectionLang
);

export default router;
