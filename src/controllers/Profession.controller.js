import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";

export async function getProfessions(req, res) {
  try {
    const { lang_code } = req.query;
    if (!lang_code || lang_code === "en") {
      // Fetch only English professions if lang_code is not provided or is 'en'
      const professions = await prisma.profession.findMany();
      return res.status(200).json({
        message: "Professions fetched successfully",
        success: true,
        professions,
      });
    } else {
      // Fetch only requested language translations if lang_code is provided
      const professions = await prisma.profession_lang.findMany({
        where: { lang_code },
        include: {
          profession: true,
        },
      });
      const mapped = professions.map((e) => ({
        ...e,
        PROF_ID: e.id,
      }));
      return res.status(200).json({
        message: `Professions fetched successfully in ${lang_code}`,
        success: true,
        professions: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching professions:", error);
    return res.status(500).json({
      message: "Error fetching professions",
      success: false,
      error: error.message,
    });
  }
}

export async function getProfessionById(req, res) {
  try {
    const { PROF_ID } = req.params;
    const { lang_code } = req.query;

    // Get the main profession record
    const profession = await prisma.profession.findUnique({
      where: { PROF_ID: Number(PROF_ID) },
    });

    if (!profession) {
      return res.status(404).json({
        message: "Profession not found",
        success: false,
      });
    }

    // If lang_code is not provided or is 'en', return the main record
    if (!lang_code || lang_code === "en") {
      return res.status(200).json({
        message: "Profession fetched successfully",
        success: true,
        profession,
      });
    } else {
      // For non-English, get the translation only if lang_code is provided
      const translation = await prisma.profession_lang.findUnique({
        where: {
          id_lang_code: {
            id: Number(PROF_ID),
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
        message: `Profession fetched successfully in ${lang_code}`,
        success: true,
        profession: translation,
      });
    }
  } catch (error) {
    console.error("Error fetching profession:", error);
    return res.status(500).json({
      message: "Error fetching profession",
      success: false,
      error: error.message,
    });
  }
}

export async function createProfession(req, res) {
  try {
    const {
      PROF_NAME,
      PROF_DESC,
      PROF_ACTIVE_YN,
      PROF_CREATED_BY,
      lang_code = "en",
    } = req.body;

    // If language is not English, return error - English content must be created first
    if (lang_code !== "en") {
      return res.status(400).json({
        message: "Main profession record must be created in English first",
        success: false,
      });
    }

    const newProfession = await prisma.profession.create({
      data: {
        PROF_NAME,
        PROF_DESC,
        PROF_ACTIVE_YN,
        PROF_CREATED_BY,
        lang_code: "en", // Always store English in main table
      },
    });

    return res.status(201).json({
      message: "Profession created successfully",
      success: true,
      profession: newProfession,
    });
  } catch (error) {
    console.error("Error creating profession:", error);
    return res.status(500).json({
      message: "Error creating profession",
      success: false,
      error: error.message,
    });
  }
}

export async function updateProfession(req, res) {
  try {
    const { PROF_ID } = req.params;
    const {
      PROF_NAME,
      PROF_DESC,
      PROF_ACTIVE_YN,
      PROF_UPDATED_BY,
      lang_code = "en",
    } = req.body;

    // For English updates, update the main table
    if (lang_code === "en") {
      const updatedProfession = await prisma.profession.update({
        where: { PROF_ID: Number(PROF_ID) },
        data: {
          PROF_NAME,
          PROF_DESC,
          PROF_ACTIVE_YN,
          PROF_UPDATED_BY,
          PROF_UPDATED_DT: new Date(),
        },
      });

      return res.status(200).json({
        message: "Profession updated successfully",
        success: true,
        profession: updatedProfession,
      });
    } else {
      // For non-English, check if the profession exists
      const profession = await prisma.profession.findUnique({
        where: { PROF_ID: Number(PROF_ID) },
      });

      if (!profession) {
        return res.status(404).json({
          message: "Profession not found",
          success: false,
        });
      }

      // Check if translation exists
      const existingTranslation = await prisma.profession_lang.findUnique({
        where: {
          id_lang_code: {
            id: Number(PROF_ID),
            lang_code,
          },
        },
      });

      let translation;
      if (existingTranslation) {
        // Update existing translation
        translation = await prisma.profession_lang.update({
          where: {
            id_lang_code: {
              id: Number(PROF_ID),
              lang_code,
            },
          },
          data: {
            PROF_NAME,
            PROF_DESC,
            PROF_ACTIVE_YN,
            PROF_UPDATED_BY,
            PROF_UPDATED_DT: new Date(),
          },
        });
      } else {
        // Create new translation
        translation = await prisma.profession_lang.create({
          data: {
            id: Number(PROF_ID),
            PROF_NAME,
            PROF_DESC,
            PROF_ACTIVE_YN,
            PROF_CREATED_BY: profession.PROF_CREATED_BY,
            PROF_CREATED_DT: profession.PROF_CREATED_DT,
            PROF_UPDATED_BY,
            PROF_UPDATED_DT: new Date(),
            lang_code,
          },
        });
      }

      return res.status(200).json({
        message: `Profession translation for language ${lang_code} ${
          existingTranslation ? "updated" : "created"
        } successfully`,
        success: true,
        translation,
      });
    }
  } catch (error) {
    console.error("Error updating profession:", error);
    return res.status(500).json({
      message: "Error updating profession",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteProfession(req, res) {
  try {
    const { PROF_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.profession_lang.delete({
        where: {
          id_lang_code: {
            id: Number(PROF_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: `Profession translation for language ${lang_code} deleted successfully`,
        success: true,
      });
    } else if (lang_code === "en") {
      return res.status(400).json({
        message:
          "To delete English content, you must delete the entire profession record by not specifying a language code",
        success: false,
      });
    } else {
      // Delete all translations first, then the main profession record
      await prisma.$transaction(async (prisma) => {
        // Delete all translations
        await prisma.profession_lang.deleteMany({
          where: { id: Number(PROF_ID) },
        });

        // Delete the main profession record
        await prisma.profession.delete({
          where: { PROF_ID: Number(PROF_ID) },
        });
      });

      return res.status(200).json({
        message: "Profession record and all translations deleted successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error deleting profession:", error);
    return res.status(500).json({
      message: "Error deleting profession",
      success: false,
      error: error.message,
    });
  }
}

// Methods specifically for handling translations

export async function createProfessionTranslation(req, res) {
  try {
    const { PROF_ID } = req.params;
    const { PROF_NAME, PROF_DESC, PROF_ACTIVE_YN, lang_code } = req.body;

    // Prevent creating English translations in the _lang table
    if (lang_code === "en") {
      return res.status(400).json({
        message:
          "English content should be stored in the main profession table, not in profession_lang",
        success: false,
      });
    }

    // Check if the main profession record exists
    const profession = await prisma.profession.findUnique({
      where: { PROF_ID: Number(PROF_ID) },
    });

    if (!profession) {
      return res.status(404).json({
        message: "Main profession record not found",
        success: false,
      });
    }

    // Check if translation already exists
    const existingTranslation = await prisma.profession_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(PROF_ID),
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
    const translation = await prisma.profession_lang.create({
      data: {
        id: Number(PROF_ID),
        PROF_NAME,
        PROF_DESC,
        PROF_ACTIVE_YN: PROF_ACTIVE_YN || profession.PROF_ACTIVE_YN,
        PROF_CREATED_BY: profession.PROF_CREATED_BY,
        PROF_CREATED_DT: profession.PROF_CREATED_DT,
        PROF_UPDATED_BY: null,
        PROF_UPDATED_DT: null,
        lang_code,
      },
    });

    return res.status(201).json({
      message: `Profession translation for language ${lang_code} created successfully`,
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error creating profession translation:", error);
    return res.status(500).json({
      message: "Error creating profession translation",
      success: false,
      error: error.message,
    });
  }
}

export async function getProfessionTranslations(req, res) {
  try {
    const { PROF_ID } = req.params;

    // Check if the main profession record exists
    const profession = await prisma.profession.findUnique({
      where: { PROF_ID: Number(PROF_ID) },
    });

    if (!profession) {
      return res.status(404).json({
        message: "Profession not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.profession_lang.findMany({
      where: { id: Number(PROF_ID) },
    });

    return res.status(200).json({
      message: "Profession translations fetched successfully",
      success: true,
      profession,
      translations,
    });
  } catch (error) {
    console.error("Error fetching profession translations:", error);
    return res.status(500).json({
      message: "Error fetching profession translations",
      success: false,
      error: error.message,
    });
  }
}

export async function updateProfessionTranslation(req, res) {
  try {
    const { PROF_ID, lang_code } = req.params;
    const { PROF_NAME, PROF_DESC, PROF_ACTIVE_YN, PROF_UPDATED_BY } = req.body;

    // Check if translation exists
    const existingTranslation = await prisma.profession_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(PROF_ID),
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

    const updatedTranslation = await prisma.profession_lang.update({
      where: {
        id_lang_code: {
          id: Number(PROF_ID),
          lang_code,
        },
      },
      data: {
        PROF_NAME,
        PROF_DESC,
        PROF_ACTIVE_YN,
        PROF_UPDATED_BY,
        PROF_UPDATED_DT: new Date(),
      },
    });

    return res.status(200).json({
      message: `Profession translation for language ${lang_code} updated successfully`,
      success: true,
      translation: updatedTranslation,
    });
  } catch (error) {
    console.error("Error updating profession translation:", error);
    return res.status(500).json({
      message: "Error updating profession translation",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteProfessionTranslation(req, res) {
  try {
    const { PROF_ID, lang_code } = req.params;

    // Check if translation exists
    const existingTranslation = await prisma.profession_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(PROF_ID),
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

    await prisma.profession_lang.delete({
      where: {
        id_lang_code: {
          id: Number(PROF_ID),
          lang_code,
        },
      },
    });

    return res.status(200).json({
      message: `Profession translation for language ${lang_code} deleted successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting profession translation:", error);
    return res.status(500).json({
      message: "Error deleting profession translation",
      success: false,
      error: error.message,
    });
  }
}
