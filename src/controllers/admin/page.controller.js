import prisma from "../../db/prismaClient.js";

// Helper to parse Accept-Language header (keep this helper function)
const getPreferredLanguage = (req) => {
  // 1. Prioritize lang_code query parameter
  if (typeof req.query.lang_code === 'string' && req.query.lang_code.length === 2) {
    return req.query.lang_code.toLowerCase();
  }

  // 2. Parse Accept-Language header
  const acceptLanguageHeader = req.headers['accept-language'];
  if (typeof acceptLanguageHeader === 'string') {
    const languages = acceptLanguageHeader.split(',').map(lang => lang.split(';')[0].trim().toLowerCase());
    if (languages.length > 0) {
      return languages[0];
    }
  }

  // 3. Default to English
  return 'en';
};

// --- NEW API FUNCTION: getPageByLinkUrl ---
export const getPageByLinkUrl = async (req, res) => {
  const { link_url } = req.params;
  const requestedLang = getPreferredLanguage(req);

  try {
    // 1. Fetch the base page details
    const page = await prisma.pages.findUnique({
      where: {
        // Normalize link_url: if it's just '/', keep it. Otherwise, ensure it starts with '/'
        link_url: link_url === '' || link_url === '/' ? '/' : `/${link_url.replace(/^\//, '')}`,
        active_yn: 1, // Only active pages (assuming 1 for active)
      },
    });

    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found or is inactive.' });
    }

    // 2. Fetch all default (English) content sections for this page
    const defaultContentSections = await prisma.content_sections.findMany({
      where: {
        page_id: page.id,
        active_yn: 1, // Only active content sections (assuming 1 for active)
      },
      orderBy: {
        id: 'asc', // Or any other sorting preference
      }
    });

    // If there are no default content sections, return the page with an empty array
    if (defaultContentSections.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Page fetched successfully with no content sections.",
        data: {
          id: page.id,
          title: page.title,
          link_url: page.link_url,
          active_yn: page.active_yn,
          content_sections: [],
        }
      });
    }

    // 3. Get IDs of all default content sections to fetch their translations
    const defaultSectionIds = defaultContentSections.map(section => section.id);

    // 4. Fetch all relevant translations for these sections
    const allTranslations = await prisma.content_sections_lang.findMany({
      where: {
        id_id: { // This is the foreign key to content_sections.id
          in: defaultSectionIds,
        },
        active_yn: 1, // Only active translations (assuming 1 for active)
      },
    });

    // 5. Assemble the final content sections with language fallback
    const finalContentSections = defaultContentSections.map(defaultSection => {
      // Find a translation that matches the requested language (or 'en' if requested)
      const matchingTranslation = allTranslations.find(
        translation =>
          translation.id_id === defaultSection.id &&
          translation.lang_code === requestedLang
      );

      if (matchingTranslation) {
        // Use translation if found
        return {
          id: defaultSection.id, // Keep the original section ID
          title: matchingTranslation.title,
          description: matchingTranslation.description,
          image_path: matchingTranslation.image_path,
          icon_path: matchingTranslation.icon_path,
          // Format date as YYYY-MM-DD. Dates from Prisma are Date objects.
          from_date: matchingTranslation.from_date ? matchingTranslation.from_date.toISOString().split('T')[0] : null,
          upto_date: matchingTranslation.upto_date ? matchingTranslation.upto_date.toISOString().split('T')[0] : null,
          active_yn: matchingTranslation.active_yn,
          lang_code: matchingTranslation.lang_code, // Indicate the language used for this section
        };
      } else {
        // Fallback to default (English) content if no specific translation found
        return {
          id: defaultSection.id,
          title: defaultSection.title,
          description: defaultSection.description,
          image_path: defaultSection.image_path,
          icon_path: defaultSection.icon_path,
          // Format date as YYYY-MM-DD.
          from_date: defaultSection.from_date ? defaultSection.from_date.toISOString().split('T')[0] : null,
          upto_date: defaultSection.upto_date ? defaultSection.upto_date.toISOString().split('T')[0] : null,
          active_yn: defaultSection.active_yn,
          lang_code: defaultSection.lang_code, // This will be 'en' from content_sections
        };
      }
    });

    // 6. Return the combined page and content sections
    return res.status(200).json({
      success: true,
      message: "Page with content fetched successfully.",
      data: {
        id: page.id,
        title: page.title,
        link_url: page.link_url,
        active_yn: page.active_yn,
        content_sections: finalContentSections,
      }
    });

  } catch (error) {
    console.error('Error fetching page by link_url:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch page by link URL.' });
  }
};
// --- END NEW API FUNCTION ---


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
        updated_date: updated_date ? new Date(updated_date) : null, // ensure Date object, allow null
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
      !created_date // created_date is required by schema for non-nullable
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
        link_url: link_url || "/", // Default to "/" if empty/null, based on schema default
        active_yn,
        created_by,
        created_date: new Date(created_date),
        updated_by: updated_by || null, // Allow null
        updated_date: updated_date ? new Date(updated_date) : null, // Allow null
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