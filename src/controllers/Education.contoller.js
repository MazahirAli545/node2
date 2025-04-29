import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
import prisma from "../db/prismaClient,js";

export async function getEducation(req, res) {
  try {
    const education = await prisma.education.findMany();
    return res.status(200).json({
      message: "Education fetched successfully",
      success: true,
      education,
    });
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
    const { EDUCATION_NAME, EDUCATION_IMAGE_URL, EDUCATION_CREATED_BY } =
      req.body;

    const newEducation = await prisma.education.create({
      data: {
        EDUCATION_NAME,
        EDUCATION_IMAGE_URL,
        EDUCATION_CREATED_BY,
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
    const updateData = req.body;

    const updatedEducation = await prisma.education.update({
      where: { EDUCATION_ID: Number(EDUCATION_ID) },
      data: updateData,
    });

    return res.status(200).json({
      message: "Education updated successfully",
      success: true,
      education: updatedEducation,
    });
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

    await prisma.education.delete({
      where: { EDUCATION_ID: Number(EDUCATION_ID) },
    });

    return res.status(200).json({
      message: "Education deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting education:", error);
    return res.status(500).json({
      message: "Error deleting education",
      success: false,
      error: error.message,
    });
  }
}
