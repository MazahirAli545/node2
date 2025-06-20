import prisma from "../../db/prismaClient.js";

// Helper to parse Accept-Language header (keep this helper function)
const getPreferredLanguage = (req) => {
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

  try {
    // 1. Fetch the base page details
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

    // 2. Fetch content sections based on requested language
    let contentSections;

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

      // If no translations found, fallback to English content
      if (contentSections.length === 0) {
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
      lang_code: section.lang_code || requestedLang,
    }));

    // Return the combined page and content sections
    return res.status(200).json({
      success: true,
      message: "Page with content fetched successfully.",
      data: {
        id: page.id,
        title: page.title,
        link_url: page.link_url,
        active_yn: page.active_yn,
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
// --- END NEW API FUNCTION ---

export const getAllPages = async (req, res) => {
  try {
    const { lang_code = "en" } = req.query;

    // Get main pages (English)
    const mainPages = await prisma.pages.findMany({
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
      },
    });

    // Merge translations with main pages, falling back to English
    const mergedPages = mainPages.map((page) => {
      const translation = translations.find((t) => t.id === page.id);
      return translation || page;
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
    const { lang_code = "en" } = req.query;

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

    // If English is requested, return main page
    if (lang_code === "en") {
      return res.status(200).json({
        success: true,
        message: "Page fetched successfully",
        data: mainPage,
      });
    }

    // For non-English, get translation
    const translation = await prisma.pages_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(id),
          lang_code,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Page fetched successfully",
      data: translation || mainPage, // Fallback to English if translation not found
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

export const createPage = async (req, res) => {
  try {
    const { title, content, active_yn = true, lang_code = "en" } = req.body;

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
