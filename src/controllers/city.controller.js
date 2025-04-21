import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();

export async function getCities(req, res) {
  try {
    const cities = await prisma.city.findMany({
      select: {
        CITY_ID: true,
        CITY_PIN_CODE: true,
        // CITY_CODE: true,
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

export async function createCity(req, res) {
  try {
    const {
      CITY_PIN_CODE,
      // CITY_CODE,
      CITY_NAME,
      CITY_DS_CODE,
      CITY_DS_NAME,
      CITY_ST_CODE,
      CITY_ST_NAME,
      CITY_CREATED_BY,
    } = req.body;

    const newCity = await prisma.city.create({
      data: {
        CITY_PIN_CODE,
        // CITY_CODE,
        CITY_NAME,
        CITY_DS_CODE,
        CITY_DS_NAME,
        CITY_ST_CODE,
        CITY_ST_NAME,
        CITY_CREATED_BY,
      },
    });

    return res.status(201).json({
      message: "City created successfully",
      success: true,
      city: newCity,
    });
  } catch (error) {
    console.error("Error creating city:", error);
    return res.status(500).json({
      message: "Error creating city",
      success: false,
      error: error.message,
    });
  }
}

export async function updateCity(req, res) {
  try {
    const { CITY_ID } = req.params;
    const updateData = req.body;

    const updatedCity = await prisma.city.update({
      where: { CITY_ID: Number(CITY_ID) },
      data: updateData,
    });

    return res.status(200).json({
      message: "City updated successfully",
      success: true,
      city: updatedCity,
    });
  } catch (error) {
    console.error("Error updating city:", error);
    return res.status(500).json({
      message: "Error updating city",
      success: false,
      error: error.message,
    });
  }
}

export async function deleteCity(req, res) {
  try {
    const { CITY_ID } = req.params;

    await prisma.city.delete({
      where: { CITY_ID: Number(CITY_ID) },
    });

    return res.status(200).json({
      message: "City deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return res.status(500).json({
      message: "Error deleting city",
      success: false,
      error: error.message,
    });
  }
}
