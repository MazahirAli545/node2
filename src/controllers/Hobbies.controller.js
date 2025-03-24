import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

async function HobbiesController(req, res) {
  try {
    const Hobbies = await prisma.Hobbies.findMany({
      select: {
        HOBBY_ID: true,
        HOBBY_NAME: true,
        HOBBY_IMAGE_URL: true,
        CITY_CREATED_BY: true,
        CITY_CREATED_AT: true,
        CITY_UPDATED_BY: true,
        CITY_UPDATED_AT: true,
      },
    });

    return res.status(200).json({
      message: "Hobbies fetched successfully",
      success: true,
      Hobbies,
    });
  } catch (error) {
    console.error("Error fetching Hobbies:", error);
    return res.status(500).json({
      message: "Error fetching Hobbies",
      success: false,
      error: error.message,
    });
  }
}

export default HobbiesController;
