import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient";
// const prisma = new PrismaClient();

export async function getStreams(req, res) {
  try {
    const streams = await prisma.stream.findMany();
    return res.status(200).json({
      message: "Streams fetched successfully",
      success: true,
      streams,
    });
  } catch (error) {
    console.error("Error fetching streams:", error);
    return res.status(500).json({
      message: "Error fetching streams",
      success: false,
      error: error.message,
    });
  }
}

export async function createStream(req, res) {
  try {
    const { STREAM_NAME, STREAM_CREATED_BY } = req.body;

    const newStream = await prisma.stream.create({
      data: {
        STREAM_NAME,
        STREAM_CREATED_BY,
      },
    });

    return res.status(201).json({
      message: "Stream created successfully",
      success: true,
      stream: newStream,
    });
  } catch (error) {
    console.error("Error creating stream:", error);
    return res.status(500).json({
      message: "Error creating stream",
      success: false,
      error: error.message,
    });
  }
}

export async function updateStream(req, res) {
  try {
    const { STREAM_ID } = req.params;
    const { STREAM_NAME, STREAM_UPDATED_BY } = req.body;

    const updatedStream = await prisma.stream.update({
      where: { STREAM_ID: Number(STREAM_ID) },
      data: {
        STREAM_NAME,
        STREAM_UPDATED_BY,
        STREAM_UPDATED_DT: new Date(),
      },
    });

    return res.status(200).json({
      message: "Stream updated successfully",
      success: true,
      stream: updatedStream,
    });
  } catch (error) {
    console.error("Error updating stream:", error);
    return res.status(500).json({
      message: "Error updating stream",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteStream(req, res) {
  try {
    const { STREAM_ID } = req.params;

    await prisma.stream.delete({
      where: { STREAM_ID: Number(STREAM_ID) },
    });

    return res.status(200).json({
      message: "Stream deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting stream:", error);
    return res.status(500).json({
      message: "Error deleting stream",
      success: false,
      error: error.message,
    });
  }
}
