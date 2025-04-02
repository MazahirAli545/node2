import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

// async function seedProfessions(req, res) {
//   try {
//       const professions = await prisma.profession.findMany(); // Fetch all professions from DB
//       return res.status(200).json({
//           message: "Professions fetched successfully",
//           success: true,
//           professions,
//       });
//   } catch (error) {
//       console.error("Error fetching professions:", error);
//       return res.status(500).json({
//           message: "Error fetching professions",
//           success: false,
//           error: error.message
//       });
//   }
// }

//   export default seedProfessions;

export async function getProfessions(req, res) {
  try {
    const professions = await prisma.profession.findMany();
    return res.status(200).json({
      message: "Professions fetched successfully",
      success: true,
      professions,
    });
  } catch (error) {
    console.error("Error fetching professions:", error);
    return res.status(500).json({
      message: "Error fetching professions",
      success: false,
      error: error.message,
    });
  }
}

export async function createProfession(req, res) {
  try {
    const { PROF_NAME, PROF_DESC, PROF_TYPE, PROF_CREATED_BY } = req.body;
    const newProfession = await prisma.profession.create({
      data: {
        PROF_NAME,
        PROF_DESC,
        PROF_TYPE,
        PROF_CREATED_BY,
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
    const updateData = req.body;

    const updatedProfession = await prisma.profession.update({
      where: { PROF_ID: Number(PROF_ID) },
      data: updateData,
    });
    return res.status(200).json({
      message: "Profession updated successfully",
      success: true,
      profession: updatedProfession,
    });
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

    await prisma.profession.delete({
      where: { PROF_ID: Number(PROF_ID) },
    });

    return res.status(200).json({
      message: "Profession deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting profession:", error);
    return res.status(500).json({
      message: "Error deleting profession",
      success: false,
      error: error.message,
    });
  }
}
