import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient.js";
const app = express();
// const prisma = new PrismaClient();

async function pincodeController(req, res) {
  try {
    const pincode = await prisma.pincode.findMany({
      include: {
        city: true, // Include city details if Pincode is linked to City
      },
    });
    return res.status(200).json({
      message: "Professions fetched successfully",
      success: true,
      pincode,
    });
  } catch (error) {
    console.error("Error fetching pincode:", error);
    return res.status(500).json({
      message: "Error fetching pincode",
      success: false,
      error: error.message,
    });
  }
}

export default pincodeController;
