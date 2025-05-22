// controllers/businessActions.js

import prisma from "../../db/prismaClient.js";

export const createBusiness = async (req, res) => {
  try {
    const { BUSS_STREM, BUSS_TYPE, BUSS_CREATED_BY } = req.body;

    if (!BUSS_STREM || !BUSS_CREATED_BY) {
      return res.status(400).json({
        message: "BUSS_STREM and BUSS_CREATED_BY are required",
        success: false,
      });
    }

    const newBusiness = await prisma.bUSSINESS.create({
      data: {
        BUSS_STREM,
        BUSS_TYPE: BUSS_TYPE || null,
        BUSS_CREATED_BY,
        BUSS_CREATED_AT: new Date(),
        BUSS_UPDATED_BY: null,
        BUSS_UPDATED_AT: null,
      },
    });

    return res.status(201).json({
      message: "Business created successfully",
      success: true,
      business: newBusiness,
    });
  } catch (error) {
    console.error("Error creating Business:", error);
    return res.status(500).json({
      message: "Error creating Business",
      success: false,
      error: error.message,
    });
  }
};


export const updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const { BUSS_STREM, BUSS_TYPE, BUSS_UPDATED_BY } = req.body;

    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        message: "Invalid business ID",
        success: false,
      });
    }

    if (!BUSS_UPDATED_BY) {
      return res.status(400).json({
        message: "BUSS_UPDATED_BY is required",
        success: false,
      });
    }

    const updatedBusiness = await prisma.bUSSINESS.update({
      where: {
        BUSS_ID: parsedId,
      },
      data: {
        BUSS_STREM,
        BUSS_TYPE: BUSS_TYPE || null,
        BUSS_UPDATED_BY,
        BUSS_UPDATED_AT: new Date(),
      },
    });

    return res.status(200).json({
      message: "Business updated successfully",
      success: true,
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Error updating Business:", error);
    return res.status(500).json({
      message: "Error updating Business",
      success: false,
      error: error.message,
    });
  }
};


export const deleteBusiness = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.bUSSINESS.delete({
      where: { BUSS_ID: parseInt(id) },
    });

    return res.status(200).json({
      message: "Business deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting Business:", error);
    return res.status(500).json({
      message: "Error deleting Business",
      success: false,
      error: error.message,
    });
  }
};
