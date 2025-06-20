import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient.js";

// const prisma = new PrismaClient();

export async function getCities(req, res) {
  try {
    const { lang_code = "en" } = req.query;
    if (lang_code === "en") {
      const cities = await prisma.city.findMany();
      return res.status(200).json({
        message: "Cities fetched successfully",
        success: true,
        cities,
      });
    } else {
      // Fetch only requested language translations
      const cities = await prisma.city_lang.findMany({
        where: { lang_code },
        include: {
          city: true,
        },
      });
      const mapped = cities.map((e) => ({
        ...e,
        CITY_ID: e.id,
      }));
      return res.status(200).json({
        message: `Cities fetched successfully in ${lang_code}`,
        success: true,
        cities: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      message: "Error fetching cities",
      success: false,
      error: error.message,
    });
  }
}

export async function createCity(req, res) {
  try {
    const {
      CITY_PIN_CODE,
      CITY_NAME,
      CITY_DS_CODE,
      CITY_DS_NAME,
      CITY_ST_CODE,
      CITY_ST_NAME,
      CITY_CREATED_BY,
      lang_code = "en",
    } = req.body;

    // Create city in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create main city (English)
      const newCity = await prisma.city.create({
        data: {
          CITY_PIN_CODE,
          CITY_NAME,
          CITY_DS_CODE,
          CITY_DS_NAME,
          CITY_ST_CODE,
          CITY_ST_NAME,
          CITY_CREATED_BY,
        },
      });

      // If non-English, create translation
      if (lang_code !== "en") {
        await prisma.city_lang.create({
          data: {
            id: newCity.CITY_ID,
            CITY_PIN_CODE,
            CITY_NAME,
            CITY_DS_CODE,
            CITY_DS_NAME,
            CITY_ST_CODE,
            CITY_ST_NAME,
            CITY_CREATED_BY,
            CITY_CREATED_AT: new Date(),
            lang_code,
          },
        });
      }

      return newCity;
    });

    return res.status(201).json({
      message: "City created successfully",
      success: true,
      city: result,
    });
  } catch (error) {
    console.error("Error creating city:", error);
    return res.status(500).json({
      message: "Error creating city",
      success: false,
      error: error.message,
    });
  }
}

export async function updateCity(req, res) {
  try {
    const { CITY_ID } = req.params;
    const { lang_code = "en", ...updateData } = req.body;

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { CITY_ID: Number(CITY_ID) },
    });

    if (!existingCity) {
      return res.status(404).json({
        message: "City not found",
        success: false,
      });
    }

    if (lang_code === "en") {
      // Update main city (English)
      const updatedCity = await prisma.city.update({
        where: { CITY_ID: Number(CITY_ID) },
        data: updateData,
      });

      return res.status(200).json({
        message: "City updated successfully",
        success: true,
        city: updatedCity,
      });
    } else {
      // Handle non-English update/create
      const translation = await prisma.city_lang.upsert({
        where: {
          id_lang_code: {
            id: Number(CITY_ID),
            lang_code,
          },
        },
        update: updateData,
        create: {
          id: Number(CITY_ID),
          ...updateData,
          lang_code,
          CITY_CREATED_AT: new Date(),
        },
      });

      return res.status(200).json({
        message: "City translation updated successfully",
        success: true,
        city: translation,
      });
    }
  } catch (error) {
    console.error("Error updating city:", error);
    return res.status(500).json({
      message: "Error updating city",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteCity(req, res) {
  try {
    const { CITY_ID } = req.params;
    const { lang_code } = req.query;

    if (lang_code && lang_code !== "en") {
      // Delete specific translation
      await prisma.city_lang.delete({
        where: {
          id_lang_code: {
            id: Number(CITY_ID),
            lang_code,
          },
        },
      });

      return res.status(200).json({
        message: "City translation deleted successfully",
        success: true,
      });
    }

    // Delete main city (will cascade delete translations)
    await prisma.city.delete({
      where: { CITY_ID: Number(CITY_ID) },
    });

    return res.status(200).json({
      message: "City deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return res.status(500).json({
      message: "Error deleting city",
      success: false,
      error: error.message,
    });
  }
}

export async function getCityTranslations(req, res) {
  try {
    const { CITY_ID } = req.params;

    // Get main city (English)
    const mainCity = await prisma.city.findUnique({
      where: { CITY_ID: Number(CITY_ID) },
    });

    if (!mainCity) {
      return res.status(404).json({
        message: "City not found",
        success: false,
      });
    }

    // Get all translations
    const translations = await prisma.city_lang.findMany({
      where: { id: Number(CITY_ID) },
    });

    return res.status(200).json({
      message: "City translations fetched successfully",
      data: {
        main: mainCity,
        translations,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error fetching city translations:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
}
