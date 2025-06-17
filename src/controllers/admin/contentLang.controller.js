import prisma from "../../db/prismaClient.js";

// Helper for date formatting
const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

export const getAllContentSectionsLang = async (req, res) => {
  try {
    const { id_id, lang_code, active_yn } = req.query; // Add filters for id_id and lang_code

    const where = {};
    if (id_id) {
      where.id_id = parseInt(id_id); // Filter by the original content section ID
    }
    if (lang_code) {
      where.lang_code = lang_code.toLowerCase(); // Filter by language code
    }
    if (active_yn !== undefined) {
      where.active_yn = parseInt(active_yn); // Filter by active status
    }

    const data = await prisma.content_sections_lang.findMany({
      where, // Apply filters
      orderBy: {
        id: "asc",
      },
    });

    // Format dates for consistency
    const formattedData = data.map(entry => ({
      ...entry,
      // from_date: formatDateToYYYYMMDD(entry.from_date),
      // upto_date: formatDateToYYYYMMDD(entry.upto_date),
      created_date: formatDateToYYYYMMDD(entry.created_date),
      updated_date: formatDateToYYYYMMDD(entry.updated_date),
    }));

    return res.status(200).json({
      success: true,
      message: "All multilingual content sections fetched successfully",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching multilingual content sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message
    });
  }
};

// --- NEW API FUNCTION: createContentSectionLang ---
export const createContentSectionLang = async (req, res) => {
  try {
    const {
      id, // <-- ADDED: Destructure 'id' from req.body
      id_id, // This is the ID of the original content_sections entry
      lang_code,
      title,
      description,
      image_path,
      icon_path,
      active_yn,
      created_by,
      created_date, // <-- ADDED: Destructure created_date from req.body
      page_id,
      refrence_page_id,
    } = req.body;

    // Basic Validation: Ensure ALL required fields are present
    // 'id' is now required as per your schema and frontend payload
    // 'created_date' is also explicitly required by your schema
    if (!id || !lang_code || !title || !description || typeof active_yn !== 'number' || !created_by || !created_date || typeof page_id !== 'number') {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for translation: id, lang_code, title, description, active_yn, created_by, created_date, page_id.",
      });
    }

    const newEntry = await prisma.content_sections_lang.create({
      data: {
        id: parseInt(id), // <-- ADDED: Pass the 'id' to Prisma
        id_id: id_id ? parseInt(id_id) : null, // Handle nullable id_id
        lang_code: lang_code.toLowerCase(),
        title,
        description,
        image_path: image_path || null,
        icon_path: icon_path || null,
        active_yn,
        created_by,
        created_date: new Date(created_date), // Use the created_date from the frontend
        page_id: parseInt(page_id), // Ensure page_id is parsed as number and non-null
        refrence_page_id: refrence_page_id ? parseInt(refrence_page_id) : null, // Handle nullable refrence_page_id
      },
    });

    return res.status(201).json({
      success: true,
      message: "Multilingual content section created successfully",
      data: newEntry,
    });
  } catch (error) {
    console.error("Error creating multilingual content section:", error);
    // Handle specific Prisma error for unique constraint violation (P2002)
    // This could happen if you try to create a translation with an 'id' that already exists.
    if (error.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: `A translation with ID ${req.body.id} already exists. Please provide a unique ID.`,
            error: error.message
        });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create multilingual content section",
      error: error.message
    });
  }
};



export const getContentSectionLangById = async (req, res) => {
  try {
    const { id } = req.params; // Expecting the primary key 'id' from URL

    // Validate if ID is a number
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: "Invalid ID provided." });
    }

    const entry = await prisma.content_sections_lang.findUnique({
      where: {
        id: parseInt(id), // Only use 'id' as it's the primary key
      },
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: `Content section language entry with ID ${id} not found`,
      });
    }

    // Format dates for consistency
    const formattedEntry = {
      ...entry,
      // from_date: formatDateToYYYYMMDD(entry.from_date),
      // upto_date: formatDateToYYYYMMDD(entry.upto_date),
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
      error: error.message
    });
  }
};


export const updateContentSectionLang = async (req, res) => {
  try {
    const { id } = req.params; // Primary key 'id' from URL
    const {
      title,
      description,
      image_path,
      icon_path,
      // from_date,
      // upto_date,
      active_yn,
      updated_by,
      page_id,
      refrence_page_id,
      // lang_code and id_id are typically part of the unique identifier
      // and not meant to be updated via a PUT operation on an existing record.
      // If you need to change lang_code/id_id, it's usually a delete then re-create.
    } = req.body;

    // Validate ID
    if (isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: "Invalid ID provided." });
    }

    const existingEntry = await prisma.content_sections_lang.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: `Content section language entry with ID ${id} not found`,
      });
    }

    // Use Prisma's update method directly. No need for raw SQL.
    const updatedEntry = await prisma.content_sections_lang.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : existingEntry.title,
        description: description !== undefined ? description : existingEntry.description,
        image_path: image_path !== undefined ? image_path : existingEntry.image_path,
        icon_path: icon_path !== undefined ? icon_path : existingEntry.icon_path,
        // from_date: from_date ? new Date(from_date) : existingEntry.from_date,
        // upto_date: upto_date ? new Date(upto_date) : existingEntry.upto_date,
        active_yn: active_yn !== undefined ? active_yn : existingEntry.active_yn,
        updated_by: updated_by !== undefined ? updated_by : existingEntry.updated_by,
        updated_date: new Date(), // Auto-set current date
        page_id: page_id !== undefined ? page_id : existingEntry.page_id,
        refrence_page_id: refrence_page_id !== undefined ? refrence_page_id : existingEntry.refrence_page_id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Language content section updated successfully",
      data: updatedEntry, // Return the updated record
    });
  } catch (error) {
    console.error("Error updating content section lang:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update content section language entry",
      error: error.message
    });
  }
};


export const deleteContentSectionLang = async (req, res) => {
  try {
    const { id } = req.params; // Primary key 'id' from URL

    if (isNaN(parseInt(id))) {
        return res.status(400).json({ success: false, message: "Invalid ID provided." });
    }

    // Check if the record exists before attempting to delete
    const existingEntry = await prisma.content_sections_lang.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        message: `No content section language entry found with ID ${id}`,
      });
    }

    // Use Prisma's delete method directly
    await prisma.content_sections_lang.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Content section language entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting content section lang:", error);
    // Handle Prisma's P2025 (Record not found) if it happens, though unlikely after findUnique
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: "Content section language entry not found for deletion." });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete content section language entry",
      error: error.message
    });
  }
};