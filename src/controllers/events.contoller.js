import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

async function getEvents(req, res) {
  try {
    const events = await prisma.events.findMany({
      include: {
        Category: true, // ✅ Fetch related Category details
      },
    });

    return res.status(200).json({
      message: "Events fetched successfully",
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      message: "Error fetching events",
      success: false,
      error: error.message,
    });
  }
}

export default getEvents;
