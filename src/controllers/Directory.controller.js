import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient";
const app = express();
// const prisma = new PrismaClient();

async function DirectoryController(req, res) {
  try {
    const directory = await prisma.peopleRegistry.findMany({});

    const Directory = directory.filter((item) => {
      return (
        item.PR_UNIQUE_ID.split("-")[3] === "001" && item.PR_GENDER === "M"
      );
    });

    return res.status(200).json({
      message: "Directory fetched successfully",
      success: true,
      Directory,
    });
  } catch (error) {
    console.error("Error fetching Directory:", error);
    return res.status(500).json({
      message: "Error fetching Directory",
      success: false,
      error: error.message,
    });
  }
}

export default DirectoryController;
