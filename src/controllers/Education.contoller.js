import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

async function getEducation(req, res) {
  try {
    const education = await prisma.education.findMany({
      select: {
        EDU_ID: true,
        EDU_NAME: true,
        EDU_IMAGE_URL: true,
        EDU_CREATED_BY: true,
        EDU_CREATED_AT: true,
        EDU_UPDATED_BY: true,
        EDU_UPDATED_AT: true,
      },
    });

    return res.status(200).json({
      message: "Education fetched successfully",
      success: true,
      education,
    });
  } catch (error) {
    console.error("Error fetching Education:", error);
    return res.status(500).json({
      message: "Error fetching Education",
      success: false,
      error: error.message,
    });
  }
}

export default getEducation;
