import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
import prisma from "../db/prismaClient.js";

export async function getEducations(req, res) {
  try {
    const { lang_code = "en" } = req.query;
    if (lang_code === "en") {
      const educations = await prisma.education.findMany();
      return res.status(200).json({
        message: "Educations fetched successfully",
        success: true,
        educations,
      });
    } else {
      // Fetch only requested language translations
      const educations = await prisma.education_lang.findMany({
        where: { lang_code },
        include: {
          education: true,
        },
      });
      const mapped = educations.map((e) => ({
        ...e,
        EDUCATION_ID: e.id,
      }));
      return res.status(200).json({
        message: `Educations fetched successfully in ${lang_code}`,
        success: true,
        educations: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching educations:", error);
    return res.status(500).json({
      message: "Error fetching educations",
      success: false,
      error: error.message,
    });
  }
}

export async function getEducationById(req, res) {
  try {
    const { EDUCATION_ID } = req.params;
    const { lang_code = "en" } = req.query;

    // Get the main education record
    const education = await prisma.education.findUnique({
      where: { EDUCATION_ID: Number(EDUCATION_ID) },
    });

    if (!education) {
      return res.status(404).json({
        message: "Education not found",
        success: false,
      });
    }

    // If requesting English content, return the main record
    if (lang_code === "en") {
      return res.status(200).json({
        message: "Education fetched successfully",
        success: true,
        education,
      });
    } else {
      // For non-English, get the translation
      const translation = await prisma.education_lang.findUnique({
        where: {
          id_lang_code: {
            id: Number(EDUCATION_ID),
            lang_code,
          },
        },
      });

      // Merge translation with base data, falling back to English
      const translatedEducation = {
        ...education,
        ...(translation && {
          EDUCATION_NAME:
            translation.EDUCATION_NAME || education.EDUCATION_NAME,
          EDUCATION_IMAGE_URL:
            translation.EDUCATION_IMAGE_URL || education.EDUCATION_IMAGE_URL,
        }),
      };

      return res.status(200).json({
        message: "Education fetched successfully",
        success: true,
        education: translatedEducation,
        hasTranslation: !!translation,
      });
    }
  } catch (error) {
    console.error("Error fetching education:", error);
    return res.status(500).json({
      message: "Error fetching education",
      success: false,
      error: error.message,
    });
  }
}

export async function createEducation(req, res) {
  try {
    const {
      EDUCATION_NAME,
      EDUCATION_IMAGE_URL,
      EDUCATION_CREATED_BY,
      lang_code = "en",
    } = req.body;

    // If language is not English, return error - English content must be created first
    if (lang_code !== "en") {
      return res.status(400).json({
        message: "Main education record must be created in English first",
        success: false,
      });
    }

    const newEducation = await prisma.education.create({
      data: {
        EDUCATION_NAME,
        EDUCATION_IMAGE_URL,
        EDUCATION_CREATED_BY,
        lang_code: "en", // Always store English in main table
      },
    });

    return res.status(201).json({
      message: "Education created successfully",
      success: true,
      education: newEducation,
    });
  } catch (error) {
    console.error("Error creating education:", error);
    return res.status(500).json({
      message: "Error creating education",
      success: false,
      error: error.message,
    });
  }
}

export async function updateEducation(req, res) {
  try {
    const { EDUCATION_ID } = req.params;
    const {
      EDUCATION_NAME,
      EDUCATION_IMAGE_URL,
      EDUCATION_UPDATED_BY,
      lang_code = "en",
    } = req.body;

    // For English updates, update the main table
    if (lang_code === "en") {
      const updatedEducation = await prisma.education.update({
        where: { EDUCATION_ID: Number(EDUCATION_ID) },
        data: {
          EDUCATION_NAME,
          EDUCATION_IMAGE_URL,
          EDUCATION_UPDATED_BY,
          EDUCATION_UPDATED_DT: new Date(),
        },
      });

      return res.status(200).json({
        message: "Education updated successfully",
        success: true,
        education: updatedEducation,
      });
    } else {
      // For non-English, check if the education exists
      const education = await prisma.education.findUnique({
        where: { EDUCATION_ID: Number(EDUCATION_ID) },
      });

      if (!education) {
        return res.status(404).json({
          message: "Education not found",
          success: false,
        });
      }

      // Check if translation exists
      const existingTranslation = await prisma.education_lang.findUnique({
        where: {
          id_lang_code: {
            id: Number(EDUCATION_ID),
            lang_code,
          },
        },
      });

      let translation;
      if (existingTranslation) {
        // Update existing translation
        translation = await prisma.education_lang.update({
          where: {
            id_lang_code: {
              id: Number(EDUCATION_ID),
              lang_code,
            },
          },
          data: {
            EDUCATION_NAME,
            EDUCATION_IMAGE_URL,
            EDUCATION_UPDATED_BY,
            EDUCATION_UPDATED_DT: new Date(),
          },
        });
      } else {
        // Create new translation
        translation = await prisma.education_lang.create({
          data: {
            id: Number(EDUCATION_ID),
            EDUCATION_NAME,
            EDUCATION_IMAGE_URL,
            EDUCATION_CREATED_BY: education.EDUCATION_CREATED_BY,
            EDUCATION_CREATED_DT: education.EDUCATION_CREATED_DT,
            EDUCATION_UPDATED_BY,
            EDUCATION_UPDATED_DT: new Date(),
            lang_code,
          },
        });
      }

      return res.status(200).json({
        message: `Education translation for language ${lang_code} ${
          existingTranslation ? "updated" : "created"
        } successfully`,
        success: true,
        translation,
      });
    }
  } catch (error) {
    console.error("Error updating education:", error);
    return res.status(500).json({
      message: "Error updating education",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteEducation(req, res) {
  try {
    const { EDUCATION_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.education_lang.delete({
        where: {
          id_lang_code: {
            id: Number(EDUCATION_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: `Education translation for language ${lang_code} deleted successfully`,
        success: true,
      });
    } else if (lang_code === "en") {
      return res.status(400).json({
        message:
          "To delete English content, you must delete the entire education record by not specifying a language code",
        success: false,
      });
    } else {
      // Delete all translations first, then the main education record
      await prisma.$transaction(async (prisma) => {
        // Delete all translations
        await prisma.education_lang.deleteMany({
          where: { id: Number(EDUCATION_ID) },
        });

        // Delete the main education record
        await prisma.education.delete({
          where: { EDUCATION_ID: Number(EDUCATION_ID) },
        });
      });

      return res.status(200).json({
        message: "Education record and all translations deleted successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error deleting education:", error);
    return res.status(500).json({
      message: "Error deleting education",
      success: false,
      error: error.message,
    });
  }
}

// Methods specifically for handling translations

export async function createEducationTranslation(req, res) {
  try {
    const { EDUCATION_ID } = req.params;
    const { EDUCATION_NAME, EDUCATION_IMAGE_URL, lang_code } = req.body;

    // Prevent creating English translations in the _lang table
    if (lang_code === "en") {
      return res.status(400).json({
        message:
          "English content should be stored in the main education table, not in education_lang",
        success: false,
      });
    }

    // Check if the main education record exists
    const education = await prisma.education.findUnique({
      where: { EDUCATION_ID: Number(EDUCATION_ID) },
    });

    if (!education) {
      return res.status(404).json({
        message: "Main education record not found",
        success: false,
      });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.education_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(EDUCATION_ID),
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
    const translation = await prisma.education_lang.create({
      data: {
        id: Number(EDUCATION_ID),
        EDUCATION_NAME,
        EDUCATION_IMAGE_URL,
        EDUCATION_CREATED_BY: education.EDUCATION_CREATED_BY,
        EDUCATION_CREATED_DT: education.EDUCATION_CREATED_DT,
        EDUCATION_UPDATED_BY: null,
        EDUCATION_UPDATED_DT: null,
        lang_code,
      },
    });

    return res.status(201).json({
      message: `Education translation for language ${lang_code} created successfully`,
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error creating education translation:", error);
    return res.status(500).json({
      message: "Error creating education translation",
      success: false,
      error: error.message,
    });
  }
}

export async function getEducationTranslations(req, res) {
  try {
    const { EDUCATION_ID } = req.params;

    // Check if the main education record exists
    const education = await prisma.education.findUnique({
      where: { EDUCATION_ID: Number(EDUCATION_ID) },
    });

    if (!education) {
      return res.status(404).json({
        message: "Education not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.education_lang.findMany({
      where: { id: Number(EDUCATION_ID) },
    });

    return res.status(200).json({
      message: "Education translations fetched successfully",
      success: true,
      education,
      translations,
    });
  } catch (error) {
    console.error("Error fetching education translations:", error);
    return res.status(500).json({
      message: "Error fetching education translations",
      success: false,
      error: error.message,
    });
  }
}
