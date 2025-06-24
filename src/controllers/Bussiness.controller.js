import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import express from "express";

const app = express();
// const prisma = new PrismaClient();

export async function getBusinesses(req, res) {
  try {
    const { lang_code = "en" } = req.query;
    if (lang_code === "en") {
      const businesses = await prisma.bUSSINESS.findMany();
      return res.status(200).json({
        message: "Business fetched successfully",
        success: true,
        businesses,
      });
    } else {
      // Fetch only requested language translations
      const businesses = await prisma.business_lang.findMany({
        where: { lang_code },
        include: {
          business: true,
        },
      });
      const mapped = businesses.map((e) => ({
        ...e,
        BUSS_ID: e.id,
      }));
      return res.status(200).json({
        message: `Business fetched successfully in ${lang_code}`,
        success: true,
        businesses: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching Business:", error);
    return res.status(500).json({
      message: "Error fetching Business",
      success: false,
      error: error.message,
    });
  }
}

export async function createBusiness(req, res) {
  try {
    const {
      BUSS_STREM,
      BUSS_TYPE,
      BUSS_CREATED_BY,
      lang_code = "en",
    } = req.body;

    // Create business in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create main business (English)
      const newBusiness = await prisma.bUSSINESS.create({
        data: {
          BUSS_STREM,
          BUSS_TYPE,
          BUSS_CREATED_BY,
        },
      });

      // If non-English, create translation
      if (lang_code !== "en") {
        await prisma.business_lang.create({
          data: {
            id: newBusiness.BUSS_ID,
            BUSS_STREM,
            BUSS_TYPE,
            BUSS_CREATED_BY,
            BUSS_CREATED_AT: new Date(),
            lang_code,
          },
        });
      }

      return newBusiness;
    });

    return res.status(201).json({
      message: "Business created successfully",
      success: true,
      business: result,
    });
  } catch (error) {
    console.error("Error creating business:", error);
    return res.status(500).json({
      message: "Error creating business",
      success: false,
      error: error.message,
    });
  }
}

export async function updateBusiness(req, res) {
  try {
    const { BUSS_ID } = req.params;
    const { lang_code = "en", ...updateData } = req.body;

    // Check if business exists
    const existingBusiness = await prisma.bUSSINESS.findUnique({
      where: { BUSS_ID: Number(BUSS_ID) },
    });

    if (!existingBusiness) {
      return res.status(404).json({
        message: "Business not found",
        success: false,
      });
    }

    if (lang_code === "en") {
      // Update main business (English)
      const updatedBusiness = await prisma.bUSSINESS.update({
        where: { BUSS_ID: Number(BUSS_ID) },
        data: updateData,
      });

      return res.status(200).json({
        message: "Business updated successfully",
        success: true,
        business: updatedBusiness,
      });
    } else {
      // Handle non-English update/create
      // Remove fields that don't exist in the business_lang model
      const translationData = { ...updateData };
      if (translationData.BUSS_ACTIVE_YN) {
        delete translationData.BUSS_ACTIVE_YN;
      }

      try {
        const translation = await prisma.business_lang.upsert({
          where: {
            id_lang_code: {
              id: Number(BUSS_ID),
              lang_code,
            },
          },
          update: translationData,
          create: {
            id: Number(BUSS_ID),
            ...translationData,
            lang_code,
            BUSS_CREATED_AT: new Date(),
          },
        });

        return res.status(200).json({
          message: "Business translation updated successfully",
          success: true,
          business: translation,
        });
      } catch (error) {
        console.error("Upsert error:", error);
        return res.status(500).json({
          message: "Error updating business translation",
          success: false,
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.error("Error updating business:", error);
    return res.status(500).json({
      message: "Error updating business",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteBusiness(req, res) {
  try {
    const { BUSS_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.business_lang.delete({
        where: {
          id_lang_code: {
            id: Number(BUSS_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: "Business translation deleted successfully",
        success: true,
      });
    }

    // Delete main business (will cascade delete translations)
    await prisma.bUSSINESS.delete({
      where: { BUSS_ID: Number(BUSS_ID) },
    });

    return res.status(200).json({
      message: "Business deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting business:", error);
    return res.status(500).json({
      message: "Error deleting business",
      success: false,
      error: error.message,
    });
  }
}

export async function getBusinessTranslations(req, res) {
  try {
    const { BUSS_ID } = req.params;

    // Get main business (English)
    const mainBusiness = await prisma.bUSSINESS.findUnique({
      where: { BUSS_ID: Number(BUSS_ID) },
    });

    if (!mainBusiness) {
      return res.status(404).json({
        message: "Business not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.business_lang.findMany({
      where: { id: Number(BUSS_ID) },
    });

    return res.status(200).json({
      message: "Business translations fetched successfully",
      data: {
        main: mainBusiness,
        translations,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching business translations:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
}

export async function createBusinessTranslation(req, res) {
  try {
    const { BUSS_ID } = req.params;
    const requestData = { ...req.body };
    const { lang_code } = requestData;

    // Remove fields that don't exist in the business_lang model
    if (requestData.BUSS_ACTIVE_YN) {
      delete requestData.BUSS_ACTIVE_YN;
    }

    if (!lang_code || lang_code === "en") {
      return res.status(400).json({
        message: "Use this endpoint only for non-English translations.",
        success: false,
      });
    }

    const mainBusiness = await prisma.bUSSINESS.findUnique({
      where: { BUSS_ID: Number(BUSS_ID) },
    });

    if (!mainBusiness) {
      return res.status(404).json({
        message: "Business not found",
        success: false,
      });
    }

    try {
      const translation = await prisma.business_lang.create({
        data: {
          id: Number(BUSS_ID),
          BUSS_STREM: requestData.BUSS_STREM,
          BUSS_TYPE: requestData.BUSS_TYPE,
          BUSS_CREATED_BY: requestData.BUSS_CREATED_BY,
          BUSS_CREATED_AT: new Date(),
          lang_code,
        },
      });

      return res.status(201).json({
        message: "Business translation created successfully",
        success: true,
        translation,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "This translation already exists in the database.",
          success: false,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error creating business translation:", error);
    return res.status(500).json({
      message: "Error creating business translation",
      success: false,
      error: error.message,
    });
  }
}

export async function getBusinessTranslationByLang(req, res) {
  try {
    const { BUSS_ID, lang_code } = req.params;
    const translation = await prisma.business_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(BUSS_ID),
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
      message: "Business translation fetched successfully",
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error fetching business translation:", error);
    return res.status(500).json({
      message: "Error fetching business translation",
      success: false,
      error: error.message,
    });
  }
}

export async function updateBusinessTranslation(req, res) {
  try {
    const { BUSS_ID, lang_code } = req.params;
    const updateData = { ...req.body };

    // Remove fields that don't exist in the business_lang model
    if (updateData.BUSS_ACTIVE_YN) {
      delete updateData.BUSS_ACTIVE_YN;
    }

    const existingTranslation = await prisma.business_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(BUSS_ID),
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

    const updatedTranslation = await prisma.business_lang.update({
      where: {
        id_lang_code: {
          id: Number(BUSS_ID),
          lang_code,
        },
      },
      data: {
        ...updateData,
        BUSS_UPDATED_AT: new Date(),
      },
    });

    return res.status(200).json({
      message: `Business translation for language ${lang_code} updated successfully`,
      success: true,
      translation: updatedTranslation,
    });
  } catch (error) {
    console.error("Error updating business translation:", error);
    return res.status(500).json({
      message: "Error updating business translation",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteBusinessTranslation(req, res) {
  try {
    const { BUSS_ID, lang_code } = req.params;
    if (lang_code === "en") {
      return res.status(400).json({
        message:
          "English content is stored in the main business table. To delete English, delete the business itself.",
        success: false,
      });
    }
    const existingTranslation = await prisma.business_lang.findUnique({
      where: {
        id_lang_code: {
          id: Number(BUSS_ID),
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
    await prisma.business_lang.delete({
      where: {
        id_lang_code: {
          id: Number(BUSS_ID),
          lang_code,
        },
      },
    });
    return res.status(200).json({
      message: `Business translation for language ${lang_code} deleted successfully`,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting business translation:", error);
    return res.status(500).json({
      message: "Error deleting business translation",
      success: false,
      error: error.message,
    });
  }
}

export default {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessTranslations,
  createBusinessTranslation,
  getBusinessTranslationByLang,
  updateBusinessTranslation,
  deleteBusinessTranslation,
};
