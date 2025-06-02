import prisma from "../../db/prismaClient.js";

export const getAllPages = async (req, res) => {
  try {
    const pages = await prisma.pages.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All pages fetched successfully",
      data: pages,
    });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pages",
    });
  }
};

export const getPageById = async (req, res) => {
  try {
    const { id } = req.params;

    // Convert to number if ID is expected as Int
    const page = await prisma.pages.findUnique({
      where: { id: Number(id) },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Page fetched successfully",
      data: page,
    });
  } catch (error) {
    console.error("Error fetching page by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page",
    });
  }
};

export const updatePageById = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link_url, active_yn, updated_by, updated_date } = req.body;

    const existingPage = await prisma.pages.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPage) {
      return res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
    }

    const updatedPage = await prisma.pages.update({
      where: { id: Number(id) },
      data: {
        title,
        link_url,
        active_yn,
        updated_by,
        updated_date: new Date(updated_date), // ensure Date object
      },
    });

    return res.status(200).json({
      success: true,
      message: "Page updated successfully",
      data: updatedPage,
    });
  } catch (error) {
    console.error("Error updating page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update page",
    });
  }
};

export const deletePageById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the page exists
    const existingPage = await prisma.pages.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPage) {
      return res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
    }

    // Delete the page
    await prisma.pages.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete page",
    });
  }
};

export const addPage = async (req, res) => {
  try {
    const {
      title,
      link_url,
      active_yn,
      created_by,
      created_date,
      updated_by,
      updated_date,
    } = req.body;

    // Basic validation (you can expand this as needed)
    if (
      !title ||
      typeof active_yn !== "number" ||
      !link_url ||
      !created_by ||
      !created_date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: title, link_url, active_yn, created_by, created_date",
      });
    }

    const newPage = await prisma.pages.create({
      data: {
        title,
        link_url: link_url || "/",
        active_yn,
        created_by,
        created_date: new Date(created_date),
        updated_by: updated_by || null,
        updated_date: updated_date ? new Date(updated_date) : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Page added successfully",
      data: newPage,
    });
  } catch (error) {
    console.error("Error adding page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add page",
    });
  }
};
