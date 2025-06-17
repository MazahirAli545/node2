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
      // from_date: formatDateToYYYYMMDD(section.from_date),
      // upto_date: formatDateToYYYYMMDD(section.upto_date),
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

    // Fetch the main content section
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
    // IMPORTANT: Use 'id' for filtering here, as 'id' in content_sections_lang
    // is now the foreign key referencing content_sections.id
    const translations = await prisma.content_sections_lang.findMany({
      where: {
        id: section.id, // <-- CORRECTED: Changed from id_id to id
      },
      orderBy: {
        lang_code: 'asc', // Order translations by language code
      }
    });

    // Format dates for the main section
    const formattedSection = {
      ...section,
      created_date: formatDateToYYYYMMDD(section.created_date),
      updated_date: formatDateToYYYYMMDD(section.updated_date),
    };

    // Format dates for translations
    const formattedTranslations = translations.map(translation => ({
      ...translation,
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
      error: error.message // Include error message for debugging on frontend
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
      active_yn,
      created_by,
      page_id,
      refrence_page_id,
      lang_code, // Main content's language code (should be 'en')
    } = req.body;

    // Basic validation for content_sections
    if (!title || !description || typeof active_yn !== 'number' || !created_by || !page_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for content section: title, description, active_yn, created_by, page_id",
      });
    }

    // 1. Create the main content_sections entry
    const newMainSection = await prisma.content_sections.create({
      data: {
        title,
        id_id: id_id || null, // Keep as nullable
        description,
        image_path: image_path || null,
        icon_path: icon_path || null,
        active_yn,
        created_by,
        created_date: new Date(), // Prisma @default(now()) should handle, but explicit is fine
        page_id,
        refrence_page_id: refrence_page_id || null,
        lang_code: lang_code || 'en', // Default to 'en' if not provided for main section
      },
    });

    // 2. Automatically create a 'hi' translation in content_sections_lang
    // Only if the main section created is NOT 'hi' (i.e., 'en' as expected)
    if (newMainSection.lang_code.toLowerCase() === 'en') {
      try {
        await prisma.content_sections_lang.create({
          data: {
            id: newMainSection.id, // Use the ID of the newly created main section
            lang_code: 'hi', // Hardcode 'hi' for the automatic translation
            title: `${newMainSection.title}`, // Placeholder title
            description: `${newMainSection.description}`, // Placeholder description
            image_path: newMainSection.image_path,
            icon_path: newMainSection.icon_path,
            active_yn: newMainSection.active_yn, // Copy from main section
            created_by: newMainSection.created_by,
            created_date: new Date(), // Current date for translation record
            page_id: newMainSection.page_id,
            refrence_page_id: newMainSection.refrence_page_id,
          },
        });
        console.log(`Auto-created 'hi' translation for content section ID: ${newMainSection.id}`);
      } catch (translationError) {
        // Log translation error but don't fail the main section creation
        console.error(`Error auto-creating 'hi' translation for ID ${newMainSection.id}:`, translationError);
        // You might want to add a warning message to the response here
      }
    }

    return res.status(201).json({
      success: true,
      message: "Content section and default 'hi' translation created successfully",
      data: newMainSection,
    });
  } catch (error) {
    console.error("Error creating content section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create content section",
      error: error.message
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
      // from_date,
      // upto_date,
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
        // from_date: from_date ? new Date(from_date) : existingSection.from_date, // Convert if provided
        // upto_date: upto_date ? new Date(upto_date) : existingSection.upto_date, // Convert if provided
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