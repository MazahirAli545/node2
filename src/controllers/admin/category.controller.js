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
    const translations = await prisma.category_lang.findMany({
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
    } = req.body;

    // Validate required fields
    if (!CATE_DESC) {
      return res.status(400).json({
        message: "Category description is required",
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
        },
      });

      // If non-English, create translation
      if (lang_code !== "en") {
        await prisma.category_lang.create({
          data: {
            id: newCategory.CATE_ID,
            CATE_DESC,
            CATE_CATE_ID,
            CATE_ACTIVE_YN,
            lang_code,
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
      const translation = await prisma.category_lang.upsert({
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
      await prisma.category_lang.delete({
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
    const translations = await prisma.category_lang.findMany({
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
