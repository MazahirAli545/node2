import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient.js";

const app = express();
// const prisma = new PrismaClient();

export async function getEvents(req, res) {
  try {
    const events = await prisma.events.findMany({
      include: {
        Category: true, // ✅ Fetch related Category details
        SubCategory: true,
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

export async function getEventById(req, res) {
  try {
    const { ENVT_ID } = req.params;

    if (!ENVT_ID || isNaN(Number(ENVT_ID))) {
      return res.status(400).json({
        message: "Invalid event ID",
        success: false,
      });
    }

    const event = await prisma.events.findUnique({
      where: {
        ENVT_ID: Number(ENVT_ID),
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Event fetched successfully",
      success: true,
      event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({
      message: "Error fetching event",
      success: false,
      error: error.message,
    });
  }
}

export async function createEvent(req, res) {
  try {
    const {
      ENVT_DESC,
      ENVT_EXCERPT,
      ENVT_DETAIL,
      ENVT_BANNER_IMAGE,
      ENVT_GALLERY_IMAGES,
      ENVT_CONTACT_NO,
      ENVT_ADDRESS,
      ENVT_CITY,
      EVNT_FROM_DT,
      EVNT_UPTO_DT,
      ENVT_CATE_ID,
      ENVT_CATE_CATE_ID,
      EVET_ACTIVE_YN,
      EVET_CREATED_BY,
    } = req.body;

    const newEvent = await prisma.events.create({
      data: {
        ENVT_DESC,
        ENVT_EXCERPT,
        ENVT_DETAIL,
        ENVT_BANNER_IMAGE,
        ENVT_GALLERY_IMAGES,
        ENVT_CONTACT_NO,
        ENVT_ADDRESS,
        ENVT_CITY,
        EVNT_FROM_DT,
        EVNT_UPTO_DT,
        ENVT_CATE_ID,
        ENVT_CATE_CATE_ID,
        EVET_ACTIVE_YN,
        EVET_CREATED_BY,
      },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    return res.status(201).json({
      message: "Event created successfully",
      success: true,
      event: newEvent,
    });
  } catch (error) {
    console.error("Error creating events:", error);
    return res.status(500).json({
      message: "Error creating events",
      success: false,
      error: error.message,
    });
  }
}

export async function updateEvent(req, res) {
  try {
    const { ENVT_ID } = req.params;
    const updateData = req.body;

    const updateEvent = await prisma.Events.update({
      where: { ENVT_ID: Number(ENVT_ID) },
      data: updateData,
    });

    return res.status(200).json({
      message: "Event updated successfully",
      success: true,
      hobby: updateEvent,
    });
  } catch (error) {
    console.error("Error Updating event:", error);
    return res.status(500).json({
      message: "Error Updating event",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteEvent(req, res) {
  try {
    const { ENVT_ID } = req.params;

    await prisma.Events.delete({
      where: { ENVT_ID: Number(ENVT_ID) },
    });

    return res.status(200).json({
      message: "Event Deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error Deleting event:", error);
    return res.status(500).json({
      message: "Error Deleting event",
      success: false,
      error: error.message,
    });
  }
}
