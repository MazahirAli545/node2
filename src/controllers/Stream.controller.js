import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// const prisma = new PrismaClient();

export async function getStreams(req, res) {
  try {
    const { lang_code = "en" } = req.query;
    if (lang_code === "en") {
      const streams = await prisma.stream.findMany();
      return res.status(200).json({
        message: "Streams fetched successfully",
        success: true,
        streams,
      });
    } else {
      // Fetch only requested language translations
      const streams = await prisma.stream_lang.findMany({
        where: { lang_code },
        include: {
          stream: true,
        },
      });
      const mapped = streams.map((e) => ({
        ...e,
        STREAM_ID: e.id,
      }));
      return res.status(200).json({
        message: `Streams fetched successfully in ${lang_code}`,
        success: true,
        streams: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching streams:", error);
    return res.status(500).json({
      message: "Error fetching streams",
      success: false,
      error: error.message,
    });
  }
}

export async function createStream(req, res) {
  try {
    const { STREAM_NAME, STREAM_CREATED_BY, lang_code = "en" } = req.body;

    // If language is not English, return error - English content must be created first
    if (lang_code !== "en") {
      return res.status(400).json({
        message: "Main stream must be created in English first",
        success: false,
      });
    }

    const newStream = await prisma.stream.create({
      data: {
        STREAM_NAME,
        STREAM_CREATED_BY,
        lang_code: "en", // Always store English in main table
      },
    });

    return res.status(201).json({
      message: "Stream created successfully",
      success: true,
      stream: newStream,
    });
  } catch (error) {
    console.error("Error creating stream:", error);
    return res.status(500).json({
      message: "Error creating stream",
      success: false,
      error: error.message,
    });
  }
}

export async function updateStream(req, res) {
  try {
    const { STREAM_ID } = req.params;
    const { STREAM_NAME, STREAM_UPDATED_BY, lang_code = "en" } = req.body;

    // For English updates, update the main table
    if (lang_code === "en") {
      const updatedStream = await prisma.stream.update({
        where: { STREAM_ID: Number(STREAM_ID) },
        data: {
          STREAM_NAME,
          STREAM_UPDATED_BY,
          STREAM_UPDATED_DT: new Date(),
        },
      });

      return res.status(200).json({
        message: "Stream updated successfully",
        success: true,
        stream: updatedStream,
      });
    } else {
      // For non-English, check if the stream exists
      const stream = await prisma.stream.findUnique({
        where: { STREAM_ID: Number(STREAM_ID) },
      });

      if (!stream) {
        return res.status(404).json({
          message: "Stream not found",
          success: false,
        });
      }

      // Check if translation exists
      const existingTranslation = await prisma.stream_lang.findUnique({
        where: {
          id_lang_code: {
            id: Number(STREAM_ID),
            lang_code,
          },
        },
      });

      let translation;
      if (existingTranslation) {
        // Update existing translation
        translation = await prisma.stream_lang.update({
          where: {
            id_lang_code: {
              id: Number(STREAM_ID),
              lang_code,
            },
          },
          data: {
            STREAM_NAME,
            STREAM_UPDATED_BY,
            STREAM_UPDATED_DT: new Date(),
          },
        });
      } else {
        // Create new translation
        translation = await prisma.stream_lang.create({
          data: {
            id: Number(STREAM_ID),
            STREAM_NAME,
            STREAM_CREATED_BY: stream.STREAM_CREATED_BY,
            STREAM_CREATED_DT: stream.STREAM_CREATED_DT,
            STREAM_UPDATED_BY,
            STREAM_UPDATED_DT: new Date(),
            lang_code,
          },
        });
      }

      return res.status(200).json({
        message: `Stream translation for language ${lang_code} ${
          existingTranslation ? "updated" : "created"
        } successfully`,
        success: true,
        translation,
      });
    }
  } catch (error) {
    console.error("Error updating stream:", error);
    return res.status(500).json({
      message: "Error updating stream",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteStream(req, res) {
  try {
    const { STREAM_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.stream_lang.delete({
        where: {
          id_lang_code: {
            id: Number(STREAM_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: `Stream translation for language ${lang_code} deleted successfully`,
        success: true,
      });
    } else if (lang_code === "en") {
      return res.status(400).json({
        message:
          "To delete English content, you must delete the entire stream by not specifying a language code",
        success: false,
      });
    } else {
      // Delete all translations first, then the main stream
      await prisma.$transaction(async (prisma) => {
        // Delete all translations
        await prisma.stream_lang.deleteMany({
          where: { id: Number(STREAM_ID) },
        });

        // Delete the main stream
        await prisma.stream.delete({
          where: { STREAM_ID: Number(STREAM_ID) },
        });
      });

      return res.status(200).json({
        message: "Stream and all translations deleted successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error deleting stream:", error);
    return res.status(500).json({
      message: "Error deleting stream",
      success: false,
      error: error.message,
    });
  }
}

// New methods for handling translations

export async function createStreamTranslation(req, res) {
  try {
    const { STREAM_ID } = req.params;
    const { STREAM_NAME, lang_code } = req.body;

    // Prevent creating English translations in the _lang table
    if (lang_code === "en") {
      return res.status(400).json({
        message:
          "English content should be stored in the main stream table, not in stream_lang",
        success: false,
      });
    }

    // Check if the main stream exists
    const stream = await prisma.stream.findUnique({
      where: { STREAM_ID: Number(STREAM_ID) },
    });

    if (!stream) {
      return res.status(404).json({
        message: "Main stream not found",
        success: false,
      });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.stream_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(STREAM_ID),
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

    // Create the translation
    const translation = await prisma.stream_lang.create({
      data: {
        id: Number(STREAM_ID),
        STREAM_NAME,
        STREAM_CREATED_BY: stream.STREAM_CREATED_BY,
        STREAM_CREATED_DT: stream.STREAM_CREATED_DT,
        STREAM_UPDATED_BY: null,
        STREAM_UPDATED_DT: null,
        lang_code,
      },
    });

    return res.status(201).json({
      message: `Stream translation for language ${lang_code} created successfully`,
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error creating stream translation:", error);
    return res.status(500).json({
      message: "Error creating stream translation",
      success: false,
      error: error.message,
    });
  }
}

export async function getStreamTranslations(req, res) {
  try {
    const { STREAM_ID } = req.params;

    // Check if the main stream exists
    const stream = await prisma.stream.findUnique({
      where: { STREAM_ID: Number(STREAM_ID) },
    });

    if (!stream) {
      return res.status(404).json({
        message: "Stream not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.stream_lang.findMany({
      where: { id: Number(STREAM_ID) },
    });

    return res.status(200).json({
      message: "Stream translations fetched successfully",
      success: true,
      stream,
      translations,
    });
  } catch (error) {
    console.error("Error fetching stream translations:", error);
    return res.status(500).json({
      message: "Error fetching stream translations",
      success: false,
      error: error.message,
    });
  }
}
