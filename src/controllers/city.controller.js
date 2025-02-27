import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

async function cityController(req, res) {
  try {
    const cities = await prisma.city.findMany({
      include: {
        pincode: true, // Include related Pincode data
      },
    });

    // Format the response to include parsed areas
    // const formattedCities = cities.map((city) => ({
    //   CITY_ID: city.CITY_ID,
    //   CITY_NAME: city.CITY_NAME,
    //   CITY_DS_CODE: city.CITY_DS_CODE,
    //   CITY_DS_NAME: city.CITY_DS_NAME,
    //   CITY_ST_CODE: city.CITY_ST_CODE,
    //   CITY_ST_NAME: city.CITY_ST_NAME,
    //   pincodes: city.pincodes.map((pincode) => ({
    //     id: pincode.id,
    //     value: pincode.value,
    //     areas: city.areas ? JSON.parse(city.areas) : [], // Ensure areas are parsed as an array
    //   })),
    // }));

    return res.status(200).json({
      message: "Cities fetched successfully",
      success: true,
      cities: formattedCities,
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
