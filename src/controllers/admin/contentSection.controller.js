import prisma from "../../db/prismaClient.js";

// Helper for date formatting, if needed in responses (though your existing code handles it)
const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

export const getAllContentSections = async (req, res) => {
  try {
    const { page_id, active_yn } = req.query; // Get query parameters

    const where = {};
    if (page_id) {
      where.page_id = parseInt(page_id); // Convert to number
    }
    if (active_yn !== undefined) { // Check for undefined to allow 0 (false)
      where.active_yn = parseInt(active_yn); // Convert to number
    }

    const sections = await prisma.content_sections.findMany({
      where, // Apply filters
      orderBy: {
        id: "asc",
      },
    });

    // Format dates for consistency in output
    const formattedSections = sections.map(section => ({
      ...section,
      from_date: formatDateToYYYYMMDD(section.from_date),
      upto_date: formatDateToYYYYMMDD(section.upto_date),
      created_date: formatDateToYYYYMMDD(section.created_date),
      updated_date: formatDateToYYYYMMDD(section.updated_date),
    }));


    return res.status(200).json({
      success: true,
      message: "All content sections fetched successfully",
      data: formattedSections,
    });
  } catch (error) {
    console.error("Error fetching content sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content sections",
    });
  }
};

// --- NEW API FUNCTION: getContentSectionById ---
export const getContentSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await prisma.content_sections.findUnique({
      where: { id: parseInt(id) },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: `Content section with ID ${id} not found`,
      });
    }

    // Fetch all translations for this content section
    const translations = await prisma.content_sections_lang.findMany({
      where: {
        id_id: section.id, // Link to the parent content_sections ID
      },
      orderBy: {
        lang_code: 'asc', // Order translations by language code
      }
    });

    // Format dates for the main section
    const formattedSection = {
      ...section,
      from_date: formatDateToYYYYMMDD(section.from_date),
      upto_date: formatDateToYYYYMMDD(section.upto_date),
      created_date: formatDateToYYYYMMDD(section.created_date),
      updated_date: formatDateToYYYYMMDD(section.updated_date),
    };

    // Format dates for translations
    const formattedTranslations = translations.map(translation => ({
      ...translation,
      from_date: formatDateToYYYYMMDD(translation.from_date),
      upto_date: formatDateToYYYYMMDD(translation.upto_date),
      created_date: formatDateToYYYYMMDD(translation.created_date),
      updated_date: formatDateToYYYYMMDD(translation.updated_date),
    }));


    return res.status(200).json({
      success: true,
      message: "Content section fetched successfully with translations",
      data: {
        ...formattedSection,
        translations: formattedTranslations, // Attach translations
      },
    });
  } catch (error) {
    console.error("Error fetching content section by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content section",
    });
  }
};


export const createContentSection = async (req, res) => {
  try {
    const {
      title,
      // id_id, // This field is for content_sections_lang linking to content_sections.id
                // Not relevant for content_sections itself. Remove if not needed.
      description,
      image_path,
      icon_path,
      from_date,
      upto_date,
      active_yn,
      created_by,
      page_id,
      refrence_page_id,
      lang_code, // Should typically be 'en' for default sections
    } = req.body;

    // Basic Validation: Ensure required fields are present
    if (!title || !description || !from_date || !upto_date || typeof active_yn !== 'number' || !created_by || !page_id) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: title, description, from_date, upto_date, active_yn, created_by, page_id",
        });
    }

    const newSection = await prisma.content_sections.create({
      data: {
        title,
        // id_id: id_id || null, // Assuming this is an optional self-referencing field, otherwise remove
        description,
        image_path,
        icon_path,
        from_date: new Date(from_date),
        upto_date: new Date(upto_date),
        active_yn,
        created_by,
        created_date: new Date(), // Automatically set to current time
        page_id,
        refrence_page_id: refrence_page_id || null, // Allow null if optional
        lang_code: lang_code || "en", // Default to "en" as this is the primary content
      },
    });

    return res.status(201).json({
      success: true,
      message: "Content section created successfully",
      data: newSection,
    });
  } catch (error) {
    console.error("Error creating content section:", error);
    // Handle Prisma validation errors specifically if needed (e.g., date format issues)
    return res.status(500).json({
      success: false,
      message: "Failed to create content section",
      error: error.message // Include error message for debugging
    });
  }
};

export const updateContentSection = async (req, res) => {
  try {
    const { id } = req.params; // ID from URL
    const {
      title,
      id_id, // Assuming this can be updated if it's a self-reference
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

    // Basic Validation: Ensure at least the ID exists (checked by findUnique below implicitly)
    // You might want to validate if any fields are actually provided for update.
    const existingSection = await prisma.content_sections.findUnique({
        where: { id: parseInt(id) }
    });

    if (!existingSection) {
        return res.status(404).json({ success: false, message: `Content section with ID ${id} not found.` });
    }

    const updatedSection = await prisma.content_sections.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : existingSection.title, // Only update if provided
        id_id: id_id !== undefined ? id_id : existingSection.id_id, // Only update if provided
        description: description !== undefined ? description : existingSection.description,
        image_path: image_path !== undefined ? image_path : existingSection.image_path,
        icon_path: icon_path !== undefined ? icon_path : existingSection.icon_path,
        from_date: from_date ? new Date(from_date) : existingSection.from_date, // Convert if provided
        upto_date: upto_date ? new Date(upto_date) : existingSection.upto_date, // Convert if provided
        active_yn: active_yn !== undefined ? active_yn : existingSection.active_yn,
        updated_by: updated_by !== undefined ? updated_by : existingSection.updated_by,
        updated_date: new Date(), // Always update updated_date on update
        page_id: page_id !== undefined ? page_id : existingSection.page_id,
        refrence_page_id: refrence_page_id !== undefined ? refrence_page_id : existingSection.refrence_page_id,
        lang_code: lang_code !== undefined ? lang_code : existingSection.lang_code,
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
      error: error.message
    });
  }
};


export const deleteContentSection = async (req, res) => {
  try {
    const { id } = req.params;
    const sectionId = parseInt(id);

    // 1. Check if the section exists
    const existingSection = await prisma.content_sections.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      return res.status(404).json({
        success: false,
        message: `Content section with ID ${id} not found`,
      });
    }

    // 2. Start a Prisma transaction for cascading delete
    // This ensures both deletes succeed or both fail.
    await prisma.$transaction(async (tx) => {
      // Delete all associated translations first
      await tx.content_sections_lang.deleteMany({
        where: { id_id: sectionId },
      });

      // Then delete the main content section
      await tx.content_sections.delete({
        where: { id: sectionId },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Content section and its translations deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content section:", error);
    // Check for Prisma's RecordNotFound if delete fails due to missing ID (unlikely after initial findUnique)
    if (error.code === 'P2025') { // Prisma error code for record not found
        return res.status(404).json({ success: false, message: "Content section not found for deletion." });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete content section",
      error: error.message
    });
  }
};