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

const prisma = new PrismaClient();

export async function getHobbies(req, res) {
  try {
    const hobbies = await prisma.hobbies.findMany();
    return res.status(200).json({
      message: "Hobbies fetched successfully",
      success: true,
      hobbies,
    });
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
    const { HOBBY_NAME, HOBBY_IMAGE_URL, CITY_CREATED_BY } = req.body;

    const newHobby = await prisma.hobbies.create({
      data: {
        HOBBY_NAME,
        HOBBY_IMAGE_URL,
        // CITY_CREATED_BY,
        HOBBY_CREATED_BY,
      },
    });

    return res.status(201).json({
      message: "Hobby created successfully",
      success: true,
      hobby: newHobby,
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
