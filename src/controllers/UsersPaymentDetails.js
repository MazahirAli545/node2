import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";

export const getAllDonationPayments = async (req, res) => {
  try {
    // Optional query parameters for filtering
    const { ENVIT_ID, status, method, fromDate, toDate } = req.query;

    // Build the where clause for filtering
    const whereClause = {};

    if (ENVIT_ID) whereClause.ENVIT_ID = parseInt(ENVIT_ID);
    if (status) whereClause.status = status;
    if (method) whereClause.method = method;

    // Date range filtering
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt.gte = new Date(fromDate);
      if (toDate) whereClause.createdAt.lte = new Date(toDate);
    }

    // Get all donation payments with optional filters
    const donations = await prisma.donationPayment.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc", // Most recent first
      },
    });

    // Format the amount from paise to rupees if needed
    const formattedDonations = donations.map((donation) => ({
      ...donation,
      amountInRupees: donation.amount / 100, // Convert paise to rupees
    }));

    return res.status(200).json({
      success: true,
      count: donations.length,
      data: formattedDonations,
    });
  } catch (error) {
    console.error("Error fetching donation payments:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to fetch donation payments",
      details: error.message,
    });
  }
};
