import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import express from "express";
import axios from "axios";

const router = express.Router();

// const RAZORPAY_API_KEY = process.env.RAZORPAY_API_KEY;
// const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

export const capturePayment = async (req, res) => {
  console.log("Incoming capture request:", req.body);

  try {
    // Validate required fields
    const requiredFields = [
      "paymentId",
      "amount",
      "ENVIT_ID",
      "cate_id",
      "PR_ID",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Prepare database record
    const paymentRecord = {
      PR_ID: parseInt(req.body.PR_ID),
      ENVIT_ID: parseInt(req.body.ENVIT_ID) || 0,
      PR_FULL_NAME: req.body.PR_FULL_NAME || "",
      paymentId: req.body.paymentId,
      entity: req.body.entity || "payment",
      amount: Math.round(parseFloat(req.body.amount) * 100), // store in paise
      currency: req.body.currency || "INR",
      status: req.body.status || "captured",
      order_id: req.body.order_id || "",
      invoice_id: req.body.invoice_id || "",
      international: req.body.international ? 1 : 0,
      method: req.body.method || "",
      amount_refunded: req.body.amount_refunded || 0,
      refund_status: req.body.refund_status ? 1 : 0,
      captured: req.body.captured || false,
      description: req.body.description || "",
      bank: req.body.bank ? 1 : 0,
      wallet: req.body.wallet ? 1 : 0,
      vpa: req.body.vpa ? 1 : 0,
      email: req.body.email || "",
      contact: req.body.contact || "",
      fee: req.body.fee || 0,
      tax: req.body.tax || 0,
      error_code: req.body.error_code || "",
      error_description: req.body.error_description || "",
      error_source: req.body.error_source || "",
      error_step: req.body.error_step || "",
      error_reason: req.body.error_reason || "",
      JSON_LOG: req.body.JSON_LOG || JSON.stringify(req.body),
      cate_id: parseInt(req.body.cate_id) || 0,
    };

    console.log("Creating payment record:", paymentRecord);

    // Save to database
    const savedPayment = await prisma.donationPayment.create({
      data: paymentRecord,
    });

    console.log("Payment saved successfully:", savedPayment);

    return res.status(200).json({
      success: true,
      message: "Payment captured and saved successfully",
      data: savedPayment,
    });
  } catch (error) {
    console.error("Database error:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to save payment",
      details: error.message,
    });
  }
};

// FETCH user Donation [My Donation]

export const getDonationsByDonor = async (req, res) => {
  try {
    const { PR_ID } = req.params;

    if (!PR_ID) {
      return res.status(400).json({
        success: false,
        error: "PR_ID is required",
      });
    }

    const donations = await prisma.donationPayment.findMany({
      where: {
        PR_ID: parseInt(PR_ID),
      },
      include: {
        Event: {
          include: {
            Category: true,
            SubCategory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response with exact schema fields
    const formattedDonations = donations.map((donation) => {
      const baseDonation = {
        paymentId: donation.paymentId,
        amount: donation.amount / 100, // Convert paise to rupees
        status: donation.status,
        currency: donation.currency,
        method: donation.method,
        createdAt: donation.createdAt,
        // Include other payment fields as needed
      };

      if (donation.Event) {
        return {
          ...baseDonation,
          event: {
            ENVT_ID: donation.Event.ENVT_ID,
            ENVT_CATE_ID: donation.Event.ENVT_CATE_ID,
            ENVT_CATE_CATE_ID: donation.Event.ENVT_CATE_CATE_ID,
            ENVT_DESC: donation.Event.ENVT_DESC,
            ENVT_EXCERPT: donation.Event.ENVT_EXCERPT,
            ENVT_DETAIL: donation.Event.ENVT_DETAIL,
            ENVT_BANNER_IMAGE: donation.Event.ENVT_BANNER_IMAGE,
            ENVT_GALLERY_IMAGES: donation.Event.ENVT_GALLERY_IMAGES,
            ENVT_CONTACT_NO: donation.Event.ENVT_CONTACT_NO,
            ENVT_ADDRESS: donation.Event.ENVT_ADDRESS,
            ENVT_CITY: donation.Event.ENVT_CITY,
            EVNT_FROM_DT: donation.Event.EVNT_FROM_DT,
            EVNT_UPTO_DT: donation.Event.EVNT_UPTO_DT,
            EVET_ACTIVE_YN: donation.Event.EVET_ACTIVE_YN,
            EVET_CREATED_BY: donation.Event.EVET_CREATED_BY,
            EVET_CREATED_DT: donation.Event.EVET_CREATED_DT,
            EVET_UPDATED_BY: donation.Event.EVET_UPDATED_BY,
            EVET_UPDATED_DT: donation.Event.EVET_UPDATED_DT,
            Category: donation.Event.Category,
            SubCategory: donation.Event.SubCategory,
          },
        };
      }

      return baseDonation;
    });

    return res.status(200).json({
      success: true,
      data: formattedDonations,
    });
  } catch (error) {
    console.error("Error fetching donations:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch donations",
      details: error.message,
    });
  }
};
