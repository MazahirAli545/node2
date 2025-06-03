import prisma from "../../db/prismaClient.js";

export const getAllContentSectionsLang = async (req, res) => {
  try {
    const data = await prisma.content_sections_lang.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All multilingual content sections fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching multilingual content sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch data",
    });
  }
};

export const getContentSectionLangById = async (req, res) => {
  try {
    const { id, lang_code } = req.params;

    const entry = await prisma.content_sections_lang.findUnique({
      where: {
        id: parseInt(id),
        lang_code: lang_code
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Content section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Content section fetched successfully",
      data: entry,
    });
  } catch (error) {
    console.error("Error fetching content section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content section",
    });
  }
};

export const updateContentSectionLang = async (req, res) => {
  try {
    const { id, lang_code } = req.params; // from URL
    const {
      title,
      description,
      image_path,
      icon_path,
      from_date,
      upto_date,
      active_yn,
      updated_by,
      updated_date,
      page_id,
      refrence_page_id,
    } = req.body;

    // Custom update using raw SQL since Prisma can't update without a unique identifier
    const result = await prisma.$executeRawUnsafe(
      `
      UPDATE content_sections_lang
      SET title = ?, description = ?, image_path = ?, icon_path = ?, from_date = ?, upto_date = ?, 
          active_yn = ?, updated_by = ?, updated_date = ?, page_id = ?, refrence_page_id = ?
      WHERE id = ? AND lang_code = ?
      `,
      title,
      description,
      image_path,
      icon_path,
      from_date,
      upto_date,
      active_yn,
      updated_by,
      updated_date,
      page_id,
      refrence_page_id,
      Number(id),
      lang_code
    );

    if (result === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching language record found to update.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language content section updated successfully",
    });
  } catch (error) {
    console.error("Error updating content section lang:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update content section language entry",
    });
  }
};

export const deleteContentSectionLang = async (req, res) => {
  const { id, lang_code } = req.params;

  if (!id || !lang_code) {
    return res.status(400).json({
      success: false,
      message: "id and lang_code are required in params",
    });
  }

  try {
    // Delete the record by matching both id and lang_code
    const deleted = await prisma.content_sections_lang.deleteMany({
      where: {
        id: Number(id),
        lang_code: lang_code,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        message: "No content section found with given id and lang_code",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Content section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content section lang:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete content section",
    });
  }
};