import { PrismaClient } from "@prisma/client";
import express from 'express';

const app = express();
const prisma = new PrismaClient();






async function seedProfessions(req, res) {
  try {
      const professions = await prisma.profession.findMany(); // Fetch all professions from DB
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
          error: error.message
      });
  }
}

  export default seedProfessions;


