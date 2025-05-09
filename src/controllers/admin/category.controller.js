// controllers/categoryController.js
import prisma from "../../db/prismaClient.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        CATE_ACTIVE_YN: 'Y', // Optional: only active categories
      },
      select: {
        CATE_ID: true,
        CATE_DESC: true,
      },
      orderBy: {
        CATE_DESC: 'asc',
      },
    });

    return res.status(200).json({
      message: "Categories fetched successfully",
      categories: categories,
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
