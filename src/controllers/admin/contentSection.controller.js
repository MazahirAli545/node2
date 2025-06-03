import prisma from "../../db/prismaClient.js";

export const getAllContentSections = async (req, res) => {
  try {
    const sections = await prisma.content_sections.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All content sections fetched successfully",
      data: sections,
    });
  } catch (error) {
    console.error("Error fetching content sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content sections",
    });
  }
};

export const createContentSection = async (req, res) => {
  try {
    const {
      title,
      id_id,
      description,
      image_path,
      icon_path,
      from_date,
      upto_date,
      active_yn,
      created_by,
      page_id,
      refrence_page_id,
      lang_code,
    } = req.body;

    const newSection = await prisma.content_sections.create({
      data: {
        title,
        id_id,
        description,
        image_path,
        icon_path,
        from_date: new Date(from_date),
        upto_date: new Date(upto_date),
        active_yn,
        created_by,
        created_date: new Date(), // Automatically set to current time
        page_id,
        refrence_page_id,
        lang_code: lang_code || "en",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Content section created successfully",
      data: newSection,
    });
  } catch (error) {
    console.error("Error creating content section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create content section",
    });
  }
};

export const updateContentSection = async (req, res) => {
  try {
    const { id } = req.params; // ID from URL
    const {
      title,
      id_id,
      description,
      image_path,
      icon_path,
      from_date,
      upto_date,
      active_yn,
      updated_by,
      page_id,
      refrence_page_id,
      lang_code,
    } = req.body;

    const updatedSection = await prisma.content_sections.update({
      where: { id: parseInt(id) },
      data: {
        title,
        id_id,
        description,
        image_path,
        icon_path,
        from_date: new Date(from_date),
        upto_date: new Date(upto_date),
        active_yn,
        updated_by,
        updated_date: new Date(),
        page_id,
        refrence_page_id,
        lang_code,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Content section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error updating content section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update content section",
    });
  }
};


export const deleteContentSection = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.content_sections.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Content section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete content section",
    });
  }
};

