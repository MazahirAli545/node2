import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import express from "express";

const app = express();
// const prisma = new PrismaClient();

export async function getBusinesses(req, res) {
  try {
    const { lang_code = "en" } = req.query;

    // Get main businesses (English)
    const mainBusinesses = await prisma.bUSSINESS.findMany({
      select: {
        BUSS_ID: true,
        BUSS_STREM: true,
        BUSS_TYPE: true,
        BUSS_CREATED_BY: true,
        BUSS_CREATED_AT: true,
        BUSS_UPDATED_BY: true,
        BUSS_UPDATED_AT: true,
      },
    });

    // If English is requested, return main businesses
    if (lang_code === "en") {
      return res.status(200).json({
        message: "Business fetched successfully",
        success: true,
        businesses: mainBusinesses,
      });
    }

    // For non-English, get translations
    const translations = await prisma.business_lang.findMany({
      where: {
        lang_code,
      },
    });

    // Merge translations with main businesses, falling back to English
    const mergedBusinesses = mainBusinesses.map((business) => {
      const translation = translations.find((t) => t.id === business.BUSS_ID);
      return translation || business;
    });

    return res.status(200).json({
      message: "Business fetched successfully",
      success: true,
      businesses: mergedBusinesses,
    });
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
      const translation = await prisma.business_lang.upsert({
        where: {
          id_lang_code: {
            id: Number(BUSS_ID),
            lang_code,
          },
        },
        update: updateData,
        create: {
          id: Number(BUSS_ID),
          ...updateData,
          lang_code,
          BUSS_CREATED_AT: new Date(),
        },
      });

      return res.status(200).json({
        message: "Business translation updated successfully",
        success: true,
        business: translation,
      });
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

export default {
  getBusinesses,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getBusinessTranslations,
};
