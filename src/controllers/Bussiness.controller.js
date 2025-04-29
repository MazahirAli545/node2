import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import express from "express";

const app = express();
// const prisma = new PrismaClient();

async function BusinessController(req, res) {
  try {
    const Business = await prisma.bUSSINESS.findMany({
      select: {
        BUSS_ID: true,
        BUSS_STREM: true,
        BUSS_TYPE: true,
        CITY_CREATED_BY: true,
        CITY_CREATED_AT: true,
        CITY_UPDATED_BY: true,
        CITY_UPDATED_AT: true,
      },
    });

    return res.status(200).json({
      message: "Business fetched successfully",
      success: true,
      Business,
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

export default BusinessController;
