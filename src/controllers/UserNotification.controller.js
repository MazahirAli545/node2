// controllers/combined.controller.js
import prisma from "../db/prismaClient.js";

export const getUserEventsAndPayments = async (req, res) => {
  try {
    const { PR_ID } = req.query;

    if (!PR_ID) {
      return res
        .status(400)
        .json({ success: false, error: "PR_ID is required" });
    }

    // 1. Fetch all Events
    const allEvents = await prisma.Event.findMany({
      orderBy: { EVET_CREATED_DT: "desc" },
      include: {
        Category: true,
        SubCategory: true,
      },
    });

    const formattedEvents = allEvents.map((event) => ({
      type: "event",
      id: event.ENVT_ID,
      createdAt: event.EVET_CREATED_DT,
      title: event.ENVT_DESC,
      banner: event.ENVT_BANNER_IMAGE,
      event: event,
    }));

    // 2. Fetch all Donations by the user
    const donations = await prisma.donationPayment.findMany({
      where: { PR_ID: parseInt(PR_ID) },
      include: {
        Event: {
          include: {
            Category: true,
            SubCategory: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedDonations = donations.map((donation) => ({
      type: "payment",
      id: donation.paymentId,
      createdAt: donation.createdAt,
      amount: donation.amount / 100,
      status: donation.status,
      method: donation.method,
      event: donation.Event,
      raw: donation,
    }));

    // 3. Merge and sort by `createdAt` (most recent first)
    const combined = [...formattedEvents, ...formattedDonations].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      data: combined,
    });
  } catch (error) {
    console.error("Error combining event and donation data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch combined data",
      details: error.message,
    });
  }
};
