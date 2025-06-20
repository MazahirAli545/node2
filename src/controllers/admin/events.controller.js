import prisma from "../../db/prismaClient.js";

/**
 * Get all events with their translations
 * This endpoint returns all events with both English and Hindi translations
 */
export const getAllEvents = async (req, res) => {
  try {
    const { lang_code = "en" } = req.query;
    if (lang_code === "en") {
      // English events from main table
      const events = await prisma.events.findMany({
        include: {
          Category: true,
          SubCategory: true,
        },
        orderBy: {
          EVET_CREATED_DT: "desc",
        },
      });
      return res.status(200).json({
        success: true,
        message: "Events fetched successfully",
        data: events,
      });
    } else {
      // Translated events from events_lang
      const events = await prisma.events_lang.findMany({
        where: { lang_code },
        include: {
          event: {
            include: {
              Category: true,
              SubCategory: true,
            },
          },
        },
        orderBy: {
          EVET_CREATED_DT: "desc",
        },
      });
      const mapped = events.map((e) => ({
        ...e,
        Category: e.event?.Category,
        SubCategory: e.event?.SubCategory,
        ENVT_ID: e.id,
      }));
      return res.status(200).json({
        success: true,
        message: `Events fetched successfully in ${lang_code}`,
        data: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

/**
 * Get a single event with its translations
 * This endpoint returns a specific event with both English and Hindi translations
 */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.events.findUnique({
      where: { ENVT_ID: Number(id) },
      include: {
        Category: true,
        SubCategory: true,
        translations: {
          where: {
            lang_code: "hi", // Only get Hindi translation
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const hindiTranslation = event.translations[0] || null;

    const formattedEvent = {
      id: event.ENVT_ID,
      category: {
        id: event.ENVT_CATE_ID,
        name: event.Category?.CATE_DESC,
      },
      subCategory: event.SubCategory
        ? {
            id: event.ENVT_CATE_CATE_ID,
            name: event.SubCategory?.CATE_DESC,
          }
        : null,
      translations: {
        en: {
          description: event.ENVT_DESC,
          excerpt: event.ENVT_EXCERPT,
          detail: event.ENVT_DETAIL,
          address: event.ENVT_ADDRESS,
          city: event.ENVT_CITY,
        },
        hi: hindiTranslation
          ? {
              description: hindiTranslation.ENVT_DESC,
              excerpt: hindiTranslation.ENVT_EXCERPT,
              detail: hindiTranslation.ENVT_DETAIL,
              address: hindiTranslation.ENVT_ADDRESS,
              city: hindiTranslation.ENVT_CITY,
            }
          : null,
      },
      bannerImage: event.ENVT_BANNER_IMAGE,
      galleryImages: event.ENVT_GALLERY_IMAGES,
      contactNo: event.ENVT_CONTACT_NO,
      fromDate: event.EVNT_FROM_DT,
      uptoDate: event.EVNT_UPTO_DT,
      isActive: event.EVET_ACTIVE_YN === "Y",
      createdBy: event.EVET_CREATED_BY,
      createdAt: event.EVET_CREATED_DT,
      updatedBy: event.EVET_UPDATED_BY,
      updatedAt: event.EVET_UPDATED_DT,
    };

    return res.status(200).json({
      success: true,
      message: "Event fetched successfully",
      data: formattedEvent,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

/**
 * Create a new event with translations
 * This endpoint creates an event with both English and Hindi translations in one go
 */
export const createEvent = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      translations,
      bannerImage,
      galleryImages,
      contactNo,
      fromDate,
      uptoDate,
      isActive,
      createdBy,
    } = req.body;

    // Validate required fields
    if (!categoryId || !translations?.en) {
      return res.status(400).json({
        success: false,
        message: "Category ID and English translation are required",
      });
    }

    // Create event in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create main event (English)
      const newEvent = await prisma.events.create({
        data: {
          ENVT_CATE_ID: categoryId,
          ENVT_CATE_CATE_ID: subCategoryId || null,
          ENVT_DESC: translations.en.description,
          ENVT_EXCERPT: translations.en.excerpt,
          ENVT_DETAIL: translations.en.detail,
          ENVT_BANNER_IMAGE: bannerImage,
          ENVT_GALLERY_IMAGES: galleryImages,
          ENVT_CONTACT_NO: contactNo,
          ENVT_ADDRESS: translations.en.address,
          ENVT_CITY: translations.en.city,
          EVNT_FROM_DT: fromDate,
          EVNT_UPTO_DT: uptoDate,
          EVET_ACTIVE_YN: isActive ? "Y" : "N",
          EVET_CREATED_BY: createdBy,
          lang_code: "en",
        },
      });

      // If Hindi translation is provided, create it
      if (translations.hi) {
        await prisma.events_lang.create({
          data: {
            id: newEvent.ENVT_ID,
            ENVT_CATE_ID: categoryId,
            ENVT_CATE_CATE_ID: subCategoryId || null,
            ENVT_DESC: translations.hi.description,
            ENVT_EXCERPT: translations.hi.excerpt,
            ENVT_DETAIL: translations.hi.detail,
            ENVT_BANNER_IMAGE: bannerImage,
            ENVT_GALLERY_IMAGES: galleryImages,
            ENVT_CONTACT_NO: contactNo,
            ENVT_ADDRESS: translations.hi.address,
            ENVT_CITY: translations.hi.city,
            EVNT_FROM_DT: fromDate,
            EVNT_UPTO_DT: uptoDate,
            EVET_ACTIVE_YN: isActive ? "Y" : "N",
            EVET_CREATED_BY: createdBy,
            EVET_CREATED_DT: new Date(),
            lang_code: "hi",
          },
        });
      }

      return newEvent;
    });

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create event",
      error: error.message,
    });
  }
};

/**
 * Update an event with translations
 * This endpoint updates an event with both English and Hindi translations in one go
 */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryId,
      subCategoryId,
      translations,
      bannerImage,
      galleryImages,
      contactNo,
      fromDate,
      uptoDate,
      isActive,
      updatedBy,
    } = req.body;

    // Check if event exists
    const existingEvent = await prisma.events.findUnique({
      where: { ENVT_ID: Number(id) },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Update event in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update main event (English)
      const updatedEvent = await prisma.events.update({
        where: { ENVT_ID: Number(id) },
        data: {
          ENVT_CATE_ID: categoryId,
          ENVT_CATE_CATE_ID: subCategoryId || null,
          ENVT_DESC: translations.en.description,
          ENVT_EXCERPT: translations.en.excerpt,
          ENVT_DETAIL: translations.en.detail,
          ENVT_BANNER_IMAGE: bannerImage,
          ENVT_GALLERY_IMAGES: galleryImages,
          ENVT_CONTACT_NO: contactNo,
          ENVT_ADDRESS: translations.en.address,
          ENVT_CITY: translations.en.city,
          EVNT_FROM_DT: fromDate,
          EVNT_UPTO_DT: uptoDate,
          EVET_ACTIVE_YN: isActive ? "Y" : "N",
          EVET_UPDATED_BY: updatedBy,
          EVET_UPDATED_DT: new Date(),
        },
      });

      // Handle Hindi translation
      if (translations.hi) {
        await prisma.events_lang.upsert({
          where: {
            id_lang_code: {
              id: Number(id),
              lang_code: "hi",
            },
          },
          update: {
            ENVT_DESC: translations.hi.description,
            ENVT_EXCERPT: translations.hi.excerpt,
            ENVT_DETAIL: translations.hi.detail,
            ENVT_ADDRESS: translations.hi.address,
            ENVT_CITY: translations.hi.city,
            EVET_UPDATED_BY: updatedBy,
            EVET_UPDATED_DT: new Date(),
          },
          create: {
            id: Number(id),
            ENVT_CATE_ID: categoryId,
            ENVT_CATE_CATE_ID: subCategoryId || null,
            ENVT_DESC: translations.hi.description,
            ENVT_EXCERPT: translations.hi.excerpt,
            ENVT_DETAIL: translations.hi.detail,
            ENVT_BANNER_IMAGE: bannerImage,
            ENVT_GALLERY_IMAGES: galleryImages,
            ENVT_CONTACT_NO: contactNo,
            ENVT_ADDRESS: translations.hi.address,
            ENVT_CITY: translations.hi.city,
            EVNT_FROM_DT: fromDate,
            EVNT_UPTO_DT: uptoDate,
            EVET_ACTIVE_YN: isActive ? "Y" : "N",
            EVET_CREATED_BY: updatedBy,
            EVET_CREATED_DT: new Date(),
            lang_code: "hi",
          },
        });
      }

      return updatedEvent;
    });

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

/**
 * Delete an event and its translations
 */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const existingEvent = await prisma.events.findUnique({
      where: { ENVT_ID: Number(id) },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Delete event (will cascade delete translations)
    await prisma.events.delete({
      where: { ENVT_ID: Number(id) },
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};
