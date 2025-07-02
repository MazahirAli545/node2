// import { PrismaClient } from "@prisma/client";
// import express from "express";

// const app = express();
// const prisma = new PrismaClient();

// async function HobbiesController(req, res) {
//   try {
//     const Hobbies = await prisma.Hobbies.findMany({
//       select: {
//         HOBBY_ID: true,
//         HOBBY_NAME: true,
//         HOBBY_IMAGE_URL: true,
//         CITY_CREATED_BY: true,
//         CITY_CREATED_AT: true,
//         CITY_UPDATED_BY: true,
//         CITY_UPDATED_AT: true,
//       },
//     });

//     return res.status(200).json({
//       message: "Hobbies fetched successfully",
//       success: true,
//       Hobbies,
//     });
//   } catch (error) {
//     console.error("Error fetching Hobbies:", error);
//     return res.status(500).json({
//       message: "Error fetching Hobbies",
//       success: false,
//       error: error.message,
//     });
//   }
// }

// export default HobbiesController;

import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// const prisma = new PrismaClient();

export async function getHobbies(req, res) {
  try {
    const { lang_code = "en" } = req.query;
    if (lang_code === "en") {
      const hobbies = await prisma.hobbies.findMany();
      return res.status(200).json({
        message: "Hobbies fetched successfully",
        success: true,
        hobbies,
      });
    } else {
      // Fetch only requested language translations
      const hobbies = await prisma.hobbies_translations.findMany({
        where: { lang_code },
        include: {
          hobby: true,
        },
      });
      const mapped = hobbies.map((e) => ({
        ...e,
        HOBBY_ID: e.id,
      }));
      return res.status(200).json({
        message: `Hobbies fetched successfully in ${lang_code}`,
        success: true,
        hobbies: mapped,
      });
    }
  } catch (error) {
    console.error("Error fetching hobbies:", error);
    return res.status(500).json({
      message: "Error fetching hobbies",
      success: false,
      error: error.message,
    });
  }
}

export async function createHobby(req, res) {
  try {
    const {
      HOBBY_NAME,
      HOBBY_IMAGE_URL,
      HOBBY_CREATED_BY,
      lang_code = "en",
    } = req.body;

    // Create the hobby and its translation in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the main hobby entry
      const newHobby = await prisma.hobbies.create({
        data: {
          HOBBY_NAME,
          HOBBY_IMAGE_URL,
          HOBBY_CREATED_BY,
          lang_code,
          // Create the translation at the same time
          translations: {
            create: {
              HOBBY_NAME,
              HOBBY_IMAGE_URL,
              lang_code,
              HOBBY_CREATED_AT: new Date(),
              HOBBY_CREATED_BY,
            },
          },
        },
        include: {
          translations: true,
        },
      });

      return newHobby;
    });

    return res.status(201).json({
      message: "Hobby and its translation created successfully",
      success: true,
      hobby: result,
    });
  } catch (error) {
    console.error("Error creating hobby:", error);
    return res.status(500).json({
      message: "Error creating hobby",
      success: false,
      error: error.message,
    });
  }
}

export async function updateHobby(req, res) {
  try {
    const { HOBBY_ID } = req.params;
    const updateData = req.body;

    const updatedHobby = await prisma.hobbies.update({
      where: { HOBBY_ID: Number(HOBBY_ID) },
      data: updateData,
      include: {
        translations: true,
      },
    });

    return res.status(200).json({
      message: "Hobby updated successfully",
      success: true,
      hobby: updatedHobby,
    });
  } catch (error) {
    console.error("Error updating hobby:", error);
    return res.status(500).json({
      message: "Error updating hobby",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteHobby(req, res) {
  try {
    const { HOBBY_ID } = req.params;

    await prisma.hobbies.delete({
      where: { HOBBY_ID: Number(HOBBY_ID) },
    });

    return res.status(200).json({
      message: "Hobby deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting hobby:", error);
    return res.status(500).json({
      message: "Error deleting hobby",
      success: false,
      error: error.message,
    });
  }
}

// Translation-specific endpoints
export async function createHobbyTranslation(req, res) {
  try {
    const { HOBBY_ID } = req.params;
    const { HOBBY_NAME, HOBBY_IMAGE_URL, lang_code } = req.body;

    const hobby = await prisma.hobbies.findUnique({
      where: { HOBBY_ID: Number(HOBBY_ID) },
    });

    if (!hobby) {
      return res.status(404).json({
        message: "Hobby not found",
        success: false,
      });
    }

    const translation = await prisma.hobbies_translations.create({
      data: {
        id: Number(HOBBY_ID),
        HOBBY_NAME,
        HOBBY_IMAGE_URL,
        lang_code,
        HOBBY_CREATED_AT: new Date(),
        HOBBY_CREATED_BY: hobby.HOBBY_CREATED_BY,
      },
    });

    return res.status(201).json({
      message: "Hobby translation created successfully",
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error creating hobby translation:", error);
    return res.status(500).json({
      message: "Error creating hobby translation",
      success: false,
      error: error.message,
    });
  }
}

export async function updateHobbyTranslation(req, res) {
  try {
    const { HOBBY_ID, lang_code } = req.params;
    const updateData = req.body;

    const translation = await prisma.hobbies_translations.update({
      where: {
        id_lang_code: {
          id: Number(HOBBY_ID),
          lang_code,
        },
      },
      data: {
        ...updateData,
        HOBBY_UPDATED_AT: new Date(),
      },
    });

    return res.status(200).json({
      message: "Hobby translation updated successfully",
      success: true,
      translation,
    });
  } catch (error) {
    console.error("Error updating hobby translation:", error);
    return res.status(500).json({
      message: "Error updating hobby translation",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteHobbyTranslation(req, res) {
  try {
    const { HOBBY_ID, lang_code } = req.params;

    await prisma.hobbies_translations.delete({
      where: {
        id_lang_code: {
          id: Number(HOBBY_ID),
          lang_code,
        },
      },
    });

    return res.status(200).json({
      message: "Hobby translation deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting hobby translation:", error);
    return res.status(500).json({
      message: "Error deleting hobby translation",
      success: false,
      error: error.message,
    });
  }
}

export async function getHobbyTranslations(req, res) {
  try {
    const { HOBBY_ID } = req.params;

    const translations = await prisma.hobbies_translations.findMany({
      where: { id: Number(HOBBY_ID) },
    });

    return res.status(200).json({
      message: "Hobby translations fetched successfully",
      success: true,
      translations,
    });
  } catch (error) {
    console.error("Error fetching hobby translations:", error);
    return res.status(500).json({
      message: "Error fetching hobby translations",
      success: false,
      error: error.message,
    });
  }
}

export async function getHobbiesWithTranslations(req, res) {
  try {
    const hobbies = await prisma.hobbies.findMany({
      include: {
        translations: true,
      },
    });

    return res.status(200).json({
      message: "Hobbies with translations fetched successfully",
      success: true,
      hobbies,
    });
  } catch (error) {
    console.error("Error fetching hobbies with translations:", error);
    return res.status(500).json({
      message: "Error fetching hobbies with translations",
      success: false,
      error: error.message,
    });
  }
}
