// controllers/categoryController.js
import prisma from "../../db/prismaClient.js";

export const getCategories = async (req, res) => {
  try {
    const { lang_code = "en" } = req.query;

    // Get main categories (English)
    const mainCategories = await prisma.category.findMany({
      where: {
        CATE_ACTIVE_YN: "Y",
      },
      select: {
        CATE_ID: true,
        CATE_CATE_ID: true,
        CATE_DESC: true,
      },
    });

    // If English is requested, return main categories
    if (lang_code === "en") {
      return res.status(200).json({
        message: "Categories fetched successfully",
        categories: mainCategories,
        success: true,
      });
    }

    // For non-English, get translations
    const translations = await prisma.category_translations.findMany({
      where: {
        lang_code,
      },
    });

    // Merge translations with main categories, falling back to English
    const mergedCategories = mainCategories.map((category) => {
      const translation = translations.find((t) => t.id === category.CATE_ID);
      return translation || category;
    });

    return res.status(200).json({
      message: "Categories fetched successfully",
      categories: mergedCategories,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const {
      CATE_DESC,
      CATE_CATE_ID,
      CATE_ACTIVE_YN = "Y",
      lang_code = "en",
      CATE_CREATED_BY,
    } = req.body;

    // Validate required fields
    if (!CATE_DESC || !CATE_CREATED_BY) {
      return res.status(400).json({
        message: "Category description and CATE_CREATED_BY are required",
        success: false,
      });
    }

    // Create category in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create main category (English)
      const newCategory = await prisma.category.create({
        data: {
          CATE_DESC,
          CATE_CATE_ID,
          CATE_ACTIVE_YN,
          CATE_CREATED_BY: Number(CATE_CREATED_BY),
          CATE_CREATED_DT: new Date(),
        },
      });

      // If non-English, create translation
      if (lang_code !== "en") {
        await prisma.category_translations.create({
          data: {
            id: newCategory.CATE_ID,
            CATE_DESC,
            CATE_CATE_ID,
            CATE_ACTIVE_YN,
            lang_code,
            CATE_CREATED_BY: Number(CATE_CREATED_BY),
            CATE_CREATED_DT: new Date(),
          },
        });
      }

      return newCategory;
    });

    return res.status(201).json({
      message: "Category created successfully",
      category: result,
      success: true,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { CATE_ID } = req.params;
    const {
      CATE_DESC,
      CATE_CATE_ID,
      CATE_ACTIVE_YN,
      lang_code = "en",
    } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { CATE_ID: Number(CATE_ID) },
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    if (lang_code === "en") {
      // Update main category (English)
      const updatedCategory = await prisma.category.update({
        where: { CATE_ID: Number(CATE_ID) },
        data: {
          CATE_DESC,
          CATE_CATE_ID,
          CATE_ACTIVE_YN,
        },
      });

      return res.status(200).json({
        message: "Category updated successfully",
        category: updatedCategory,
        success: true,
      });
    } else {
      // Handle non-English update/create
      const translation = await prisma.category_translations.upsert({
        where: {
          id_lang_code: {
            id: Number(CATE_ID),
            lang_code,
          },
        },
        update: {
          CATE_DESC,
          CATE_CATE_ID,
          CATE_ACTIVE_YN,
        },
        create: {
          id: Number(CATE_ID),
          CATE_DESC,
          CATE_CATE_ID,
          CATE_ACTIVE_YN,
          lang_code,
        },
      });

      return res.status(200).json({
        message: "Category translation updated successfully",
        category: translation,
        success: true,
      });
    }
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { CATE_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.category_translations.delete({
        where: {
          id_lang_code: {
            id: Number(CATE_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: "Category translation deleted successfully",
        success: true,
      });
    }

    // Delete main category (will cascade delete translations)
    await prisma.category.delete({
      where: { CATE_ID: Number(CATE_ID) },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

export const getCategoryTranslations = async (req, res) => {
  try {
    const { CATE_ID } = req.params;

    // Get main category (English)
    const mainCategory = await prisma.category.findUnique({
      where: { CATE_ID: Number(CATE_ID) },
    });

    if (!mainCategory) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.category_translations.findMany({
      where: { id: Number(CATE_ID) },
    });

    return res.status(200).json({
      message: "Category translations fetched successfully",
      data: {
        main: mainCategory,
        translations,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching category translations:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// --- CATEGORY TRANSLATION CRUD ---

// Create a translation for a category
export const createCategoryTranslation = async (req, res) => {
  try {
    const { CATE_ID } = req.params;
    const {
      CATE_DESC,
      CATE_CATE_ID,
      CATE_ACTIVE_YN = "Y",
      lang_code,
      CATE_CREATED_BY,
    } = req.body;

    if (!lang_code || !CATE_DESC || !CATE_CREATED_BY) {
      return res.status(400).json({
        message: "lang_code, CATE_DESC, and CATE_CREATED_BY are required",
        success: false,
      });
    }

    // Check if translation already exists
    const existing = await prisma.category_translations.findUnique({
      where: {
        id_lang_code: {
          id: Number(CATE_ID),
          lang_code,
        },
      },
    });
    if (existing) {
      return res.status(409).json({
        message: `Translation for category ${CATE_ID} and lang_code ${lang_code} already exists`,
        success: false,
      });
    }

    // Create translation
    const translation = await prisma.category_translations.create({
      data: {
        id: Number(CATE_ID),
        CATE_DESC,
        CATE_CATE_ID,
        CATE_ACTIVE_YN,
        lang_code,
        CATE_CREATED_BY: Number(CATE_CREATED_BY),
        CATE_CREATED_DT: new Date(),
      },
    });

    return res.status(201).json({
      message: "Category translation created successfully",
      translation,
      success: true,
    });
  } catch (error) {
    console.error("Error creating category translation:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Get a specific translation for a category
export const getCategoryTranslation = async (req, res) => {
  try {
    const { CATE_ID, lang_code } = req.params;
    const translation = await prisma.category_translations.findUnique({
      where: {
        id_lang_code: {
          id: Number(CATE_ID),
          lang_code,
        },
      },
    });
    if (!translation) {
      return res.status(404).json({
        message: "Category translation not found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Category translation fetched successfully",
      translation,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching category translation:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Update a translation for a category
export const updateCategoryTranslation = async (req, res) => {
  try {
    const { CATE_ID, lang_code } = req.params;
    const { CATE_DESC, CATE_CATE_ID, CATE_ACTIVE_YN } = req.body;

    // Check if translation exists
    const existing = await prisma.category_translations.findUnique({
      where: {
        id_lang_code: {
          id: Number(CATE_ID),
          lang_code,
        },
      },
    });
    if (!existing) {
      return res.status(404).json({
        message: "Category translation not found",
        success: false,
      });
    }

    const updated = await prisma.category_translations.update({
      where: {
        id_lang_code: {
          id: Number(CATE_ID),
          lang_code,
        },
      },
      data: {
        CATE_DESC: CATE_DESC !== undefined ? CATE_DESC : existing.CATE_DESC,
        CATE_CATE_ID:
          CATE_CATE_ID !== undefined ? CATE_CATE_ID : existing.CATE_CATE_ID,
        CATE_ACTIVE_YN:
          CATE_ACTIVE_YN !== undefined
            ? CATE_ACTIVE_YN
            : existing.CATE_ACTIVE_YN,
      },
    });

    return res.status(200).json({
      message: "Category translation updated successfully",
      translation: updated,
      success: true,
    });
  } catch (error) {
    console.error("Error updating category translation:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// Delete a translation for a category
export const deleteCategoryTranslation = async (req, res) => {
  try {
    const { CATE_ID, lang_code } = req.params;
    await prisma.category_translations.delete({
      where: {
        id_lang_code: {
          id: Number(CATE_ID),
          lang_code,
        },
      },
    });
    return res.status(200).json({
      message: "Category translation deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting category translation:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};
