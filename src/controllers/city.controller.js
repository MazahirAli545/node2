import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

async function cityController(req, res) {
  try {
    const cities = await prisma.city.findMany({
      select: {
        CITY_ID: true,
        CITY_PIN_CODE: true,
        CITY_CODE: true,
        CITY_NAME: true,
        CITY_DS_CODE: true,
        CITY_DS_NAME: true,
        CITY_ST_CODE: true,
        CITY_ST_NAME: true,
        CITY_CREATED_BY: true,
        CITY_CREATED_AT: true,
        CITY_UPDATED_BY: true,
        CITY_UPDATED_AT: true,
      },
    });

    return res.status(200).json({
      message: "Cities fetched successfully",
      success: true,
      cities,
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      message: "Error fetching cities",
      success: false,
      error: error.message,
    });
  }
}

export default cityController;
