import { PrismaClient } from "@prisma/client";
import express from 'express';

const app = express();
const prisma = new PrismaClient();






async function pincodeController(req, res) {
  try {
      const pincode = await prisma.pincode.findMany(); // Fetch all professions from DB
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
          error: error.message
      });
  }
}

  export default pincodeController;


