import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient.js";
import { sendNotificationToTokens } from "./fcm.controller.js";

const app = express();
// const prisma = new PrismaClient();

export async function getEvents(req, res) {
  try {
    const { lang_code = "en" } = req.query;

    const events = await prisma.events.findMany({
      where: {
        lang_code,
      },
      include: {
        Category: true, // ✅ Fetch related Category details
        SubCategory: true,
      },
    });

    return res.status(200).json({
      message: "Events fetched successfully",
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      message: "Error fetching events",
      success: false,
      error: error.message,
    });
  }
}

export async function getEventById(req, res) {
  try {
    const { ENVT_ID } = req.params;
    const { lang_code = "en" } = req.query;

    if (!ENVT_ID || isNaN(Number(ENVT_ID))) {
      return res.status(400).json({
        message: "Invalid event ID",
        success: false,
      });
    }

    // First try to find the event in the requested language
    let event = await prisma.events.findFirst({
      where: {
        ENVT_ID: Number(ENVT_ID),
        lang_code,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    // If not found and language is not English, fall back to English
    if (!event && lang_code !== "en") {
      event = await prisma.events.findFirst({
        where: {
          ENVT_ID: Number(ENVT_ID),
          lang_code: "en",
        },
        include: {
          Category: true,
          SubCategory: true,
        },
      });
    }

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    // Get available translations
    const availableTranslations = await prisma.events_lang.findMany({
      where: {
        id: Number(ENVT_ID),
      },
      select: {
        lang_code: true,
      },
    });

    return res.status(200).json({
      message: "Event fetched successfully",
      success: true,
      event,
      availableTranslations: availableTranslations.map((t) => t.lang_code),
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({
      message: "Error fetching event",
      success: false,
      error: error.message,
    });
  }
}

export async function createEvent(req, res) {
  try {
    const {
      ENVT_DESC,
      ENVT_EXCERPT,
      ENVT_DETAIL,
      ENVT_BANNER_IMAGE,
      ENVT_GALLERY_IMAGES,
      ENVT_CONTACT_NO,
      ENVT_ADDRESS,
      ENVT_CITY,
      EVNT_FROM_DT,
      EVNT_UPTO_DT,
      ENVT_CATE_ID,
      ENVT_CATE_CATE_ID,
      EVET_ACTIVE_YN,
      EVET_CREATED_BY,
      lang_code = "en",
    } = req.body;

    // Create the event in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the main event entry (English only)
      const newEvent = await prisma.events.create({
        data: {
          ENVT_DESC,
          ENVT_EXCERPT,
          ENVT_DETAIL,
          ENVT_BANNER_IMAGE,
          ENVT_GALLERY_IMAGES,
          ENVT_CONTACT_NO,
          ENVT_ADDRESS,
          ENVT_CITY,
          EVNT_FROM_DT,
          EVNT_UPTO_DT,
          ENVT_CATE_ID,
          ENVT_CATE_CATE_ID,
          EVET_ACTIVE_YN,
          EVET_CREATED_BY,
          lang_code: "en", // Always store English in main table
        },
        include: {
          Category: true,
          SubCategory: true,
        },
      });

      // Only create translation entry if the language is not English
      if (lang_code !== "en") {
        await prisma.events_lang.create({
          data: {
            id: newEvent.ENVT_ID,
            ENVT_DESC,
            ENVT_EXCERPT,
            ENVT_DETAIL,
            ENVT_BANNER_IMAGE,
            ENVT_GALLERY_IMAGES,
            ENVT_CONTACT_NO,
            ENVT_ADDRESS,
            ENVT_CITY,
            EVNT_FROM_DT,
            EVNT_UPTO_DT,
            ENVT_CATE_ID,
            ENVT_CATE_CATE_ID,
            EVET_ACTIVE_YN,
            EVET_CREATED_BY,
            EVET_CREATED_DT: new Date(),
            lang_code,
          },
        });
      }

      return newEvent;
    });

    // Send notifications after successful creation
    const allFcmTokens = await prisma.fcmToken.findMany({
      select: {
        fcmToken: true,
      },
    });

    console.log("Event fcm: ", allFcmTokens);
    const tokens = allFcmTokens.map((tokenData) => tokenData.fcmToken);

    const notificationTitle = "New Event Added!";
    const notificationBody = `Check out the new event: ${result.ENVT_DESC}`;

    const notificationResult = await sendNotificationToTokens(
      tokens,
      notificationTitle,
      notificationBody
    );

    if (notificationResult.success) {
      console.log("FCM Notification sent successfully:", notificationResult);
    } else {
      console.error(
        "Failed to send FCM notification:",
        notificationResult.error
      );
    }

    return res.status(201).json({
      message: "Event and its translation created successfully",
      success: true,
      event: result,
      notificationStatus: {
        success: notificationResult.success,
        message: notificationResult.message,
        successfulCount: notificationResult.successfulCount,
        failedCount: notificationResult.failedCount,
      },
    });
  } catch (error) {
    console.error("Error creating events:", error);
    return res.status(500).json({
      message: "Error creating events",
      success: false,
      error: error.message,
    });
  }
}

export async function updateEvent(req, res) {
  try {
    const { ENVT_ID } = req.params;
    const updateData = req.body;
    const { lang_code = "en" } = updateData;

    const updateEvent = await prisma.events.update({
      where: {
        ENVT_ID: Number(ENVT_ID),
        lang_code,
      },
      data: updateData,
    });

    return res.status(200).json({
      message: "Event updated successfully",
      success: true,
      event: updateEvent,
    });
  } catch (error) {
    console.error("Error Updating event:", error);
    return res.status(500).json({
      message: "Error Updating event",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { ENVT_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // If lang_code is provided and not 'en', delete only that specific translation
      // This is handled by the deleteEventTranslation function, but included here for API consistency
      await prisma.events_lang.delete({
        where: {
          id_lang_code: {
            id: Number(ENVT_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: `Event translation for language ${lang_code} deleted successfully`,
        success: true,
      });
    } else if (lang_code === "en") {
      // If lang_code is 'en', explain that deleting English means deleting the entire event
      return res.status(400).json({
        message:
          "To delete English content, you must delete the entire event by not specifying a language code",
        success: false,
      });
    } else {
      // If no lang_code is provided, delete the entire event and all its related data
      await prisma.$transaction(async (prisma) => {
        // First delete any donation payments associated with this event
        await prisma.donationPayment.deleteMany({
          where: { ENVIT_ID: Number(ENVT_ID) },
        });

        // Then delete all translations (non-English versions)
        await prisma.events_lang.deleteMany({
          where: { id: Number(ENVT_ID) },
        });

        // Finally delete the main event (which contains the English version)
        await prisma.events.delete({
          where: { ENVT_ID: Number(ENVT_ID) },
        });
      });

      return res.status(200).json({
        message: "Event and all related data deleted successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error Deleting event:", error);
    return res.status(500).json({
      message: "Error Deleting event",
      success: false,
      error: error.message,
    });
  }
}

// New methods for handling translations

export async function createEventTranslation(req, res) {
  try {
    const { ENVT_ID } = req.params;
    const {
      ENVT_DESC,
      ENVT_EXCERPT,
      ENVT_DETAIL,
      ENVT_BANNER_IMAGE,
      ENVT_GALLERY_IMAGES,
      ENVT_CONTACT_NO,
      ENVT_ADDRESS,
      ENVT_CITY,
      EVNT_FROM_DT,
      EVNT_UPTO_DT,
      EVET_ACTIVE_YN,
      lang_code,
    } = req.body;

    // Prevent creating English translations in the _lang table
    if (lang_code === "en") {
      return res.status(400).json({
        message:
          "English content should be stored in the main events table, not in events_lang",
        success: false,
      });
    }

    // First, check if the main event exists
    const mainEvent = await prisma.events.findUnique({
      where: { ENVT_ID: Number(ENVT_ID) },
    });

    if (!mainEvent) {
      return res.status(404).json({
        message: "Main event not found",
        success: false,
      });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.events_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(ENVT_ID),
          lang_code,
        },
      },
    });

    if (existingTranslation) {
      return res.status(400).json({
        message: `Translation for language ${lang_code} already exists`,
        success: false,
      });
    }

    // Create the translation (non-English only)
    const translation = await prisma.events_lang.create({
      data: {
        id: Number(ENVT_ID),
        ENVT_CATE_ID: mainEvent.ENVT_CATE_ID,
        ENVT_CATE_CATE_ID: mainEvent.ENVT_CATE_CATE_ID,
        ENVT_DESC,
        ENVT_EXCERPT,
        ENVT_DETAIL,
        ENVT_BANNER_IMAGE: ENVT_BANNER_IMAGE || mainEvent.ENVT_BANNER_IMAGE,
        ENVT_GALLERY_IMAGES:
          ENVT_GALLERY_IMAGES || mainEvent.ENVT_GALLERY_IMAGES,
        ENVT_CONTACT_NO: ENVT_CONTACT_NO || mainEvent.ENVT_CONTACT_NO,
        ENVT_ADDRESS,
        ENVT_CITY,
        EVNT_FROM_DT: EVNT_FROM_DT || mainEvent.EVNT_FROM_DT,
        EVNT_UPTO_DT: EVNT_UPTO_DT || mainEvent.EVNT_UPTO_DT,
        EVET_ACTIVE_YN: EVET_ACTIVE_YN || mainEvent.EVET_ACTIVE_YN,
        EVET_CREATED_BY: mainEvent.EVET_CREATED_BY,
        EVET_CREATED_DT: new Date(),
        lang_code,
      },
    });

    return res.status(201).json({
      message: `Event translation for language ${lang_code} created successfully`,
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error creating event translation:", error);
    return res.status(500).json({
      message: "Error creating event translation",
      success: false,
      error: error.message,
    });
  }
}

export async function getEventTranslations(req, res) {
  try {
    const { ENVT_ID } = req.params;

    // Check if the main event exists
    const mainEvent = await prisma.events.findUnique({
      where: { ENVT_ID: Number(ENVT_ID) },
    });

    if (!mainEvent) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.events_lang.findMany({
      where: { id: Number(ENVT_ID) },
    });

    return res.status(200).json({
      message: "Event translations fetched successfully",
      success: true,
      mainEvent,
      translations,
    });
  } catch (error) {
    console.error("Error fetching event translations:", error);
    return res.status(500).json({
      message: "Error fetching event translations",
      success: false,
      error: error.message,
    });
  }
}

export async function getEventTranslationByLang(req, res) {
  try {
    const { ENVT_ID, lang_code } = req.params;

    // Try to find the translation
    const translation = await prisma.events_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(ENVT_ID),
          lang_code,
        },
      },
    });

    if (!translation) {
      return res.status(404).json({
        message: `Translation for language ${lang_code} not found`,
        success: false,
      });
    }

    return res.status(200).json({
      message: "Event translation fetched successfully",
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error fetching event translation:", error);
    return res.status(500).json({
      message: "Error fetching event translation",
      success: false,
      error: error.message,
    });
  }
}

export async function updateEventTranslation(req, res) {
  try {
    const { ENVT_ID, lang_code } = req.params;
    const updateData = req.body;

    // Check if the translation exists
    const existingTranslation = await prisma.events_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(ENVT_ID),
          lang_code,
        },
      },
    });

    if (!existingTranslation) {
      return res.status(404).json({
        message: `Translation for language ${lang_code} not found`,
        success: false,
      });
    }

    // Update the translation
    const updatedTranslation = await prisma.events_lang.update({
      where: {
        id_lang_code: {
          id: Number(ENVT_ID),
          lang_code,
        },
      },
      data: {
        ...updateData,
        EVET_UPDATED_DT: new Date(),
      },
    });

    return res.status(200).json({
      message: `Event translation for language ${lang_code} updated successfully`,
      success: true,
      translation: updatedTranslation,
    });
  } catch (error) {
    console.error("Error updating event translation:", error);
    return res.status(500).json({
      message: "Error updating event translation",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteEventTranslation(req, res) {
  try {
    const { ENVT_ID, lang_code } = req.params;

    // English content is in the main table, not in events_lang
    if (lang_code === "en") {
      return res.status(400).json({
        message:
          "English content is stored in the main events table, not in events_lang. To delete English content, delete the entire event.",
        success: false,
      });
    }

    // Check if the translation exists
    const existingTranslation = await prisma.events_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(ENVT_ID),
          lang_code,
        },
      },
    });

    if (!existingTranslation) {
      return res.status(404).json({
        message: `Translation for language ${lang_code} not found`,
        success: false,
      });
    }

    // Delete the translation
    await prisma.events_lang.delete({
      where: {
        id_lang_code: {
          id: Number(ENVT_ID),
          lang_code,
        },
      },
    });

    return res.status(200).json({
      message: `Event translation for language ${lang_code} deleted successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting event translation:", error);
    return res.status(500).json({
      message: "Error deleting event translation",
      success: false,
      error: error.message,
    });
  }
}

// New method to fetch events with all translations
export async function getEventsWithAllTranslations(req, res) {
  try {
    // Get all main events (English)
    const mainEvents = await prisma.events.findMany({
      where: {
        lang_code: "en",
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    // Get all translations for these events
    const eventsWithTranslations = await Promise.all(
      mainEvents.map(async (event) => {
        const translations = await prisma.events_lang.findMany({
          where: {
            id: event.ENVT_ID,
          },
        });

        return {
          ...event,
          translations: translations,
        };
      })
    );

    return res.status(200).json({
      message: "Events with all translations fetched successfully",
      success: true,
      events: eventsWithTranslations,
    });
  } catch (error) {
    console.error("Error fetching events with translations:", error);
    return res.status(500).json({
      message: "Error fetching events with translations",
      success: false,
      error: error.message,
    });
  }
}
