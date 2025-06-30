import prisma from "../../db/prismaClient.js";

// Helper for date formatting
const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

export const getAllContentSectionsLang = async (req, res) => {
  try {
    const { id, lang_code } = req.query; // 'id' now refers to the parent content section ID

    const where = {};
    if (id) {
      where.id = parseInt(id); // Filter by the parent content section ID
    }
    if (lang_code) {
      where.lang_code = lang_code.toLowerCase(); // Filter by language code
    }
    // IMPORTANT: Automatically filter out 'en' as they are in the main table
    where.lang_code = {
      not: "en",
    };

    const data = await prisma.content_sections_lang.findMany({
      where, // Apply filters (including auto-filtering 'en')
      orderBy: {
        id: "asc", // Order by parent content ID
      },
    });

    // Format dates for consistency
    const formattedData = data.map((entry) => ({
      ...entry,
      created_date: formatDateToYYYYMMDD(entry.created_date),
      updated_date: formatDateToYYYYMMDD(entry.updated_date),
    }));

    return res.status(200).json({
      success: true,
      message:
        "All multilingual content sections fetched successfully (excluding 'en')",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching multilingual content sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

export const createContentSectionLang = async (req, res) => {
  try {
    const {
      id, // This is the ID of the original content_sections entry (part of PK)
      lang_code, // This is the language code (part of PK)
      title,
      description,
      image_path,
      icon_path,
      active_yn,
      created_by,
      created_date,
      page_id,
      refrence_page_id,
      id_id, // This field is included in the schema
      button_one,
      button_one_slug,
      button_two,
      button_two_slug,
      flex_01,
    } = req.body;

    // Enforce no 'en' translations allowed in content_sections_lang
    if (lang_code.toLowerCase() === "en") {
      return res.status(400).json({
        success: false,
        message:
          "English (en) translations are stored in the main content_sections table and cannot be added here.",
      });
    }

    // Basic Validation: Ensure ALL required fields are present for the composite PK
    if (
      !id ||
      !lang_code ||
      !title ||
      !description ||
      typeof active_yn !== "number" ||
      !created_by ||
      !created_date ||
      typeof page_id !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields for translation: id (parent content ID), lang_code, title, description, active_yn, created_by, created_date, page_id.",
      });
    }

    // Check if parent content section exists
    const parentSection = await prisma.content_sections.findUnique({
      where: { id: parseInt(id) },
    });
    if (!parentSection) {
      return res.status(404).json({
        success: false,
        message: `Parent content section with ID ${id} not found. Cannot create translation.`,
      });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.content_sections_lang.findUnique({
      where: {
        id_lang_code: {
          id: parseInt(id),
          lang_code: lang_code.toLowerCase(),
        },
      },
    });

    if (existingTranslation) {
      return res.status(409).json({
        success: false,
        message: `A translation for content section ID ${id} and language ${lang_code} already exists.`,
      });
    }

    const newEntry = await prisma.content_sections_lang.create({
      data: {
        id: parseInt(id), // This is the FK to content_sections.id
        lang_code: lang_code.toLowerCase(),
        title,
        description,
        image_path: image_path || null,
        icon_path: icon_path || null,
        active_yn,
        created_by,
        created_date: new Date(created_date),
        page_id: parseInt(page_id),
        refrence_page_id: refrence_page_id ? parseInt(refrence_page_id) : null,
        id_id: id_id ? parseInt(id_id) : null, // Process id_id if present
        button_one: button_one || null,
        button_one_slug: button_one_slug || null,
        button_two: button_two || null,
        button_two_slug: button_two_slug || null,
        flex_01: flex_01 || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Multilingual content section created successfully",
      data: newEntry,
    });
  } catch (error) {
    console.error("Error creating multilingual content section:", error);
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `A translation for content section ID ${req.body.id} and language ${req.body.lang_code} already exists.`,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create multilingual content section",
      error: error.message,
    });
  }
};

export const getContentSectionLangById = async (req, res) => {
  try {
    const { id, lang_code } = req.params; // Composite PK from URL parameters

    if (isNaN(parseInt(id)) || !lang_code) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID or language code provided.",
      });
    }

    const entry = await prisma.content_sections_lang.findUnique({
      where: {
        // Use the composite primary key syntax for findUnique
        id_lang_code: {
          id: parseInt(id),
          lang_code: lang_code.toLowerCase(),
        },
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: `Content section language entry with ID ${id} and lang_code ${lang_code} not found`,
      });
    }

    // Format dates for consistency
    const formattedEntry = {
      ...entry,
      created_date: formatDateToYYYYMMDD(entry.created_date),
      updated_date: formatDateToYYYYMMDD(entry.updated_date),
    };

    return res.status(200).json({
      success: true,
      message: "Content section language entry fetched successfully",
      data: formattedEntry,
    });
  } catch (error) {
    console.error("Error fetching content section lang by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch content section language entry",
      error: error.message,
    });
  }
};

export const updateContentSectionLang = async (req, res) => {
  try {
    const { id, lang_code } = req.params; // Composite PK from URL parameters
    const {
      title,
      description,
      image_path,
      icon_path,
      active_yn,
      updated_by,
      page_id,
      refrence_page_id,
      id_id, // Also process id_id if it's potentially updated
      button_one,
      button_one_slug,
      button_two,
      button_two_slug,
      flex_01,
    } = req.body;

    if (isNaN(parseInt(id)) || !lang_code) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID or language code provided.",
      });
    }

    // Enforce no 'en' translations allowed to be updated here
    if (lang_code.toLowerCase() === "en") {
      return res.status(400).json({
        success: false,
        message:
          "English (en) translations are stored in the main content_sections table and cannot be updated here.",
      });
    }

    const existingEntry = await prisma.content_sections_lang.findUnique({
      where: {
        id_lang_code: {
          id: parseInt(id),
          lang_code: lang_code.toLowerCase(),
        },
      },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: `Content section language entry with ID ${id} and lang_code ${lang_code} not found`,
      });
    }

    const updatedEntry = await prisma.content_sections_lang.update({
      where: {
        id_lang_code: {
          id: parseInt(id),
          lang_code: lang_code.toLowerCase(),
        },
      },
      data: {
        title: title !== undefined ? title : existingEntry.title,
        description:
          description !== undefined ? description : existingEntry.description,
        image_path:
          image_path !== undefined ? image_path : existingEntry.image_path,
        icon_path:
          icon_path !== undefined ? icon_path : existingEntry.icon_path,
        active_yn:
          active_yn !== undefined ? active_yn : existingEntry.active_yn,
        updated_by:
          updated_by !== undefined ? updated_by : existingEntry.updated_by,
        updated_date: new Date(), // Auto-set current date
        page_id:
          page_id !== undefined ? parseInt(page_id) : existingEntry.page_id,
        refrence_page_id:
          refrence_page_id !== undefined
            ? parseInt(refrence_page_id)
            : existingEntry.refrence_page_id,
        id_id: id_id !== undefined ? parseInt(id_id) : existingEntry.id_id, // Update id_id if provided
        button_one:
          button_one !== undefined ? button_one : existingEntry.button_one,
        button_one_slug:
          button_one_slug !== undefined
            ? button_one_slug
            : existingEntry.button_one_slug,
        button_two:
          button_two !== undefined ? button_two : existingEntry.button_two,
        button_two_slug:
          button_two_slug !== undefined
            ? button_two_slug
            : existingEntry.button_two_slug,
        flex_01: flex_01 !== undefined ? flex_01 : existingEntry.flex_01,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Language content section updated successfully",
      data: updatedEntry,
    });
  } catch (error) {
    console.error("Error updating content section lang:", error);
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Content section language entry not found for update.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update content section language entry",
      error: error.message,
    });
  }
};

export const deleteContentSectionLang = async (req, res) => {
  try {
    const { id, lang_code } = req.params; // Composite PK from URL parameters

    if (isNaN(parseInt(id)) || !lang_code) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID or language code provided.",
      });
    }

    // Enforce no 'en' translations allowed to be deleted here
    if (lang_code.toLowerCase() === "en") {
      return res.status(400).json({
        success: false,
        message:
          "English (en) translations are stored in the main content_sections table and cannot be deleted here.",
      });
    }

    const existingEntry = await prisma.content_sections_lang.findUnique({
      where: {
        id_lang_code: {
          id: parseInt(id),
          lang_code: lang_code.toLowerCase(),
        },
      },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: `No content section language entry found with ID ${id} and lang_code ${lang_code}`,
      });
    }

    await prisma.content_sections_lang.delete({
      where: {
        id_lang_code: {
          id: parseInt(id),
          lang_code: lang_code.toLowerCase(),
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Content section language entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content section lang:", error);
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Content section language entry not found for deletion.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete content section language entry",
      error: error.message,
    });
  }
};
