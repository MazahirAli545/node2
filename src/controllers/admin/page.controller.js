import prisma from "../../db/prismaClient.js";

// Helper to parse Accept-Language header (keep this helper function)
const getPreferredLanguage = (req) => {
  // 0. Skip if lang_code is 'id' (special case for getPageById route)
  if (req.params.lang_code === "id") {
    return "en";
  }

  // 1. Get language from URL path if available
  if (
    req.params.lang_code &&
    ["en", "hi"].includes(req.params.lang_code.toLowerCase())
  ) {
    return req.params.lang_code.toLowerCase();
  }

  // 2. Fallback to query parameter if URL path language not available
  if (
    typeof req.query.lang_code === "string" &&
    ["en", "hi"].includes(req.query.lang_code.toLowerCase())
  ) {
    return req.query.lang_code.toLowerCase();
  }

  // 3. Parse Accept-Language header as last resort
  const acceptLanguageHeader = req.headers["accept-language"];
  if (typeof acceptLanguageHeader === "string") {
    const languages = acceptLanguageHeader
      .split(",")
      .map((lang) => lang.split(";")[0].trim().toLowerCase());
    if (languages.length > 0 && ["en", "hi"].includes(languages[0])) {
      return languages[0];
    }
  }

  // 4. Default to English
  return "en";
};

// --- NEW API FUNCTION: getPageByLinkUrl ---
export const getPageByLinkUrl = async (req, res) => {
  const { lang_code, link_url } = req.params;
  const requestedLang = getPreferredLanguage(req);
  const { screen_type = "both" } = req.query; // Get screen_type from query params, default to "both"

  try {
    // 1. Fetch the base page details with screen_type filter
    const page = await prisma.pages.findUnique({
      where: {
        // Handle root path and undefined link_url cases
        link_url:
          !link_url || link_url === "/"
            ? "/"
            : `/${link_url.replace(/^\//, "")}`,
        active_yn: 1, // Only active pages
      },
    });

    if (!page) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found or is inactive." });
    }

    // Check if the page should be displayed on the requested screen type
    if (
      screen_type !== "both" &&
      page.screen_type !== "both" &&
      page.screen_type !== screen_type
    ) {
      return res.status(404).json({
        success: false,
        message: `Page not available on ${screen_type} screen.`,
      });
    }

    // 2. Fetch content sections based on requested language
    let contentSections;
    let translatedPage = page;

    if (requestedLang !== "en") {
      // For non-English, get page translation if it exists
      const pageTranslation = await prisma.pages_lang.findUnique({
        where: {
          id_lang_code: {
            id: page.id,
            lang_code: requestedLang,
          },
        },
      });

      if (pageTranslation) {
        translatedPage = {
          ...page,
          ...pageTranslation,
        };
      } else if (req.query.lang_code) {
        // If language was explicitly requested via query param and no translation exists, return 404
        return res.status(404).json({
          success: false,
          message: `Translation not found for language: ${requestedLang}`,
        });
      }
      // Otherwise fall back to English (default behavior)
    }

    if (requestedLang === "en") {
      // For English, fetch from main content_sections table
      contentSections = await prisma.content_sections.findMany({
        where: {
          page_id: page.id,
          active_yn: 1,
        },
        orderBy: {
          id: "asc",
        },
      });
    } else {
      // For other languages (e.g., Hindi), fetch from content_sections_lang table
      contentSections = await prisma.content_sections_lang.findMany({
        where: {
          page_id: page.id,
          lang_code: requestedLang,
          active_yn: 1,
        },
        orderBy: {
          id: "asc",
        },
      });

      // If no translations found and language was explicitly requested, return 404
      if (contentSections.length === 0 && req.query.lang_code) {
        return res.status(404).json({
          success: false,
          message: `No content sections found for language: ${requestedLang}`,
        });
      } else if (contentSections.length === 0) {
        // If language was determined from Accept-Language header, fall back to English
        contentSections = await prisma.content_sections.findMany({
          where: {
            page_id: page.id,
            active_yn: 1,
          },
          orderBy: {
            id: "asc",
          },
        });
      }
    }

    // Format dates for consistency
    const formattedSections = contentSections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      image_path: section.image_path,
      icon_path: section.icon_path,
      active_yn: section.active_yn,
      button_one: section.button_one,
      button_one_slug: section.button_one_slug,
      button_two: section.button_two,
      button_two_slug: section.button_two_slug,
      flex_01: section.flex_01,
      lang_code: section.lang_code || requestedLang,
    }));

    // Return the combined page and content sections
    return res.status(200).json({
      success: true,
      message: "Page with content fetched successfully.",
      data: {
        id: page.id,
        title: translatedPage.title,
        link_url: translatedPage.link_url,
        active_yn: translatedPage.active_yn,
        screen_type: translatedPage.screen_type,
        lang_code: requestedLang,
        content_sections: formattedSections,
      },
    });
  } catch (error) {
    console.error("Error fetching page by link_url:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch page by link URL." });
  }
};

// --- TRANSLATION API FUNCTIONS ---

/**
 * Add a translation for a specific page
 */
export const addPageTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      link_url,
      screen_type = "both",
      active_yn = 1,
      lang_code,
    } = req.body;

    // Validate required fields
    if (!lang_code || !title) {
      return res.status(400).json({
        success: false,
        message: "Language code and title are required",
      });
    }

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

    // Check if translation already exists
    const existingTranslation = await prisma.pages_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
    });

    if (existingTranslation) {
      return res.status(409).json({
        success: false,
        message: `Translation for language ${lang_code} already exists for this page`,
      });
    }

    // Create the translation
    const translation = await prisma.pages_lang.create({
      data: {
        id: Number(id),
        title,
        link_url: link_url || existingPage.link_url,
        screen_type,
        active_yn,
        lang_code,
        created_date: new Date(),
        updated_date: new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Page translation added successfully",
      data: translation,
    });
  } catch (error) {
    console.error("Error adding page translation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add page translation",
    });
  }
};

/**
 * Update a specific page translation
 */
export const updatePageTranslation = async (req, res) => {
  try {
    const { id, lang_code } = req.params;
    const { title, link_url, screen_type, active_yn } = req.body;

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

    // Check if the translation exists
    const existingTranslation = await prisma.pages_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
    });

    if (!existingTranslation) {
      return res.status(404).json({
        success: false,
        message: `Translation for language ${lang_code} not found for this page`,
      });
    }

    // Update the translation
    const updatedTranslation = await prisma.pages_lang.update({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
      data: {
        title: title !== undefined ? title : existingTranslation.title,
        link_url:
          link_url !== undefined ? link_url : existingTranslation.link_url,
        screen_type:
          screen_type !== undefined
            ? screen_type
            : existingTranslation.screen_type,
        active_yn:
          active_yn !== undefined ? active_yn : existingTranslation.active_yn,
        updated_date: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Page translation updated successfully",
      data: updatedTranslation,
    });
  } catch (error) {
    console.error("Error updating page translation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update page translation",
    });
  }
};

/**
 * Get a specific page translation
 */
export const getPageTranslation = async (req, res) => {
  try {
    const { id, lang_code } = req.params;

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

    // If requesting English, return the main page
    if (lang_code === "en") {
      return res.status(200).json({
        success: true,
        message: "Page translation fetched successfully",
        data: {
          ...existingPage,
          lang_code: "en",
        },
      });
    }

    // Get the translation
    const translation = await prisma.pages_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
    });

    if (!translation) {
      return res.status(404).json({
        success: false,
        message: `Translation for language ${lang_code} not found for this page`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Page translation fetched successfully",
      data: translation,
    });
  } catch (error) {
    console.error("Error fetching page translation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page translation",
    });
  }
};

/**
 * Delete a specific page translation
 */
export const deletePageTranslation = async (req, res) => {
  try {
    const { id, lang_code } = req.params;

    // Cannot delete English (main page)
    if (lang_code === "en") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the main page (English). Use deletePage instead.",
      });
    }

    // Check if the translation exists
    const existingTranslation = await prisma.pages_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
    });

    if (!existingTranslation) {
      return res.status(404).json({
        success: false,
        message: `Translation for language ${lang_code} not found for page ID ${id}`,
      });
    }

    // Delete the translation
    await prisma.pages_lang.delete({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Page translation for language ${lang_code} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting page translation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete page translation",
    });
  }
};

/**
 * Get all available languages for a page
 */
export const getPageAvailableLanguages = async (req, res) => {
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

    // Get all translations for this page
    const translations = await prisma.pages_lang.findMany({
      where: { id: Number(id) },
      select: { lang_code: true },
    });

    // Always include English (main page)
    const languages = ["en", ...translations.map((t) => t.lang_code)];

    return res.status(200).json({
      success: true,
      message: "Available languages fetched successfully",
      data: languages,
    });
  } catch (error) {
    console.error("Error fetching available languages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch available languages",
    });
  }
};

// --- END TRANSLATION API FUNCTIONS ---

export const getAllPages = async (req, res) => {
  try {
    const { lang_code = "en", screen_type } = req.query;

    // Prepare filter conditions
    const whereCondition = {};

    // Add screen_type filter if provided
    if (screen_type) {
      whereCondition.OR = [{ screen_type }, { screen_type: "both" }];
    }

    // Get main pages (English)
    const mainPages = await prisma.pages.findMany({
      where: whereCondition,
      orderBy: {
        id: "asc",
      },
    });

    // If English is requested, return main pages
    if (lang_code === "en") {
      return res.status(200).json({
        success: true,
        message: "All pages fetched successfully",
        data: mainPages,
      });
    }

    // For non-English, get translations
    const translations = await prisma.pages_lang.findMany({
      where: {
        lang_code,
        id: { in: mainPages.map((page) => page.id) },
      },
    });

    // If explicitly requesting a non-English language and no translations exist, return empty array
    if (translations.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No translations found for language: ${lang_code}`,
        data: [],
      });
    }

    // Only return pages that have translations in the requested language
    const translatedPageIds = translations.map((t) => t.id);
    const filteredMainPages = mainPages.filter((page) =>
      translatedPageIds.includes(page.id)
    );

    // Merge translations with filtered main pages
    const mergedPages = filteredMainPages.map((page) => {
      const translation = translations.find((t) => t.id === page.id);
      return {
        ...page,
        ...translation,
      };
    });

    return res.status(200).json({
      success: true,
      message: "All pages fetched successfully",
      data: mergedPages,
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
    const requestedLang = req.query.lang_code || "en";
    const { screen_type = "both" } = req.query;

    // Get main page (English)
    const page = await prisma.pages.findUnique({
      where: { id: Number(id) },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
    }

    // Check if the page should be displayed on the requested screen type
    if (
      screen_type !== "both" &&
      page.screen_type !== "both" &&
      page.screen_type !== screen_type
    ) {
      return res.status(404).json({
        success: false,
        message: `Page not available on ${screen_type} screen.`,
      });
    }

    // Fetch content sections based on requested language
    let contentSections;
    let translatedPage = page;

    if (requestedLang !== "en") {
      // For non-English, get page translation if it exists
      const pageTranslation = await prisma.pages_lang.findUnique({
        where: {
          id_lang_code: {
            id: page.id,
            lang_code: requestedLang,
          },
        },
      });

      if (pageTranslation) {
        translatedPage = {
          ...page,
          ...pageTranslation,
        };
      } else if (req.query.lang_code) {
        // If language was explicitly requested via query param and no translation exists, return 404
        return res.status(404).json({
          success: false,
          message: `Translation not found for language: ${requestedLang}`,
        });
      }
      // Otherwise fall back to English (default behavior)
    }

    if (requestedLang === "en") {
      // For English, fetch from main content_sections table
      contentSections = await prisma.content_sections.findMany({
        where: {
          page_id: page.id,
          active_yn: 1,
        },
        orderBy: {
          id: "asc",
        },
      });
    } else {
      // For other languages (e.g., Hindi), fetch from content_sections_lang table
      contentSections = await prisma.content_sections_lang.findMany({
        where: {
          page_id: page.id,
          lang_code: requestedLang,
          active_yn: 1,
        },
        orderBy: {
          id: "asc",
        },
      });

      // If no translations found and language was explicitly requested, return 404
      if (contentSections.length === 0 && req.query.lang_code) {
        return res.status(404).json({
          success: false,
          message: `No content sections found for language: ${requestedLang}`,
        });
      } else if (contentSections.length === 0) {
        // If language was determined from Accept-Language header, fall back to English
        contentSections = await prisma.content_sections.findMany({
          where: {
            page_id: page.id,
            active_yn: 1,
          },
          orderBy: {
            id: "asc",
          },
        });
      }
    }

    // Format dates for consistency
    const formattedSections = contentSections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      image_path: section.image_path,
      icon_path: section.icon_path,
      active_yn: section.active_yn,
      button_one: section.button_one,
      button_one_slug: section.button_one_slug,
      button_two: section.button_two,
      button_two_slug: section.button_two_slug,
      flex_01: section.flex_01,
      lang_code: section.lang_code || requestedLang,
    }));

    // Return the combined page and content sections
    return res.status(200).json({
      success: true,
      message: "Page with content fetched successfully.",
      data: {
        id: page.id,
        title: translatedPage.title,
        link_url: translatedPage.link_url,
        active_yn: translatedPage.active_yn,
        screen_type: translatedPage.screen_type,
        lang_code: requestedLang,
        content_sections: formattedSections,
      },
    });
  } catch (error) {
    console.error("Error fetching page by ID:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch page by ID." });
  }
};

export const updatePageById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      link_url,
      screen_type,
      active_yn,
      updated_by,
      updated_date,
    } = req.body;

    // Validate screen_type if provided
    if (screen_type && !["web", "app", "both"].includes(screen_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid screen_type. Must be 'web', 'app', or 'both'",
      });
    }

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
        screen_type, // Add screen_type to update
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
      screen_type = "both", // Default to "both" if not provided
      active_yn,
      created_by,
      created_date,
      updated_by,
      updated_date,
    } = req.body;

    // Validate screen_type
    if (screen_type && !["web", "app", "both"].includes(screen_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid screen_type. Must be 'web', 'app', or 'both'",
      });
    }

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
        screen_type, // Add screen_type
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

export const createPage = async (req, res) => {
  try {
    const {
      title,
      content,
      screen_type = "both",
      active_yn = true,
      lang_code = "en",
    } = req.body;

    // Validate screen_type
    if (!["web", "app", "both"].includes(screen_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid screen_type. Must be 'web', 'app', or 'both'",
      });
    }

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // Create page in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create main page (English)
      const newPage = await prisma.pages.create({
        data: {
          title,
          content,
          screen_type,
          active_yn,
        },
      });

      // If non-English, create translation
      if (lang_code !== "en") {
        await prisma.pages_lang.create({
          data: {
            id: newPage.id,
            title,
            content,
            screen_type,
            active_yn,
            lang_code,
            created_date: new Date(),
          },
        });
      }

      return newPage;
    });

    return res.status(201).json({
      success: true,
      message: "Page created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create page",
    });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang_code = "en", ...updateData } = req.body;

    // Validate screen_type if provided
    if (
      updateData.screen_type &&
      !["web", "app", "both"].includes(updateData.screen_type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid screen_type. Must be 'web', 'app', or 'both'",
      });
    }

    // Check if page exists
    const existingPage = await prisma.pages.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPage) {
      return res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
    }

    if (lang_code === "en") {
      // Update main page (English)
      const updatedPage = await prisma.pages.update({
        where: { id: Number(id) },
        data: {
          ...updateData,
          updated_date: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Page updated successfully",
        data: updatedPage,
      });
    } else {
      // Handle non-English update/create
      const translation = await prisma.pages_lang.upsert({
        where: {
          id_lang_code: {
            id: Number(id),
            lang_code,
          },
        },
        update: {
          ...updateData,
          updated_date: new Date(),
        },
        create: {
          id: Number(id),
          ...updateData,
          lang_code,
          created_date: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: "Page translation updated successfully",
        data: translation,
      });
    }
  } catch (error) {
    console.error("Error updating page:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update page",
    });
  }
};

export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.pages_lang.delete({
        where: {
          id_lang_code: {
            id: Number(id),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: "Page translation deleted successfully",
      });
    }

    // Delete main page (will cascade delete translations)
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

export const getPageTranslations = async (req, res) => {
  try {
    const { id } = req.params;

    // Get main page (English)
    const mainPage = await prisma.pages.findUnique({
      where: { id: Number(id) },
    });

    if (!mainPage) {
      return res.status(404).json({
        success: false,
        message: `Page with ID ${id} not found`,
      });
    }

    // Get all translations
    const translations = await prisma.pages_lang.findMany({
      where: { id: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Page translations fetched successfully",
      data: {
        main: mainPage,
        translations,
      },
    });
  } catch (error) {
    console.error("Error fetching page translations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch page translations",
    });
  }
};
