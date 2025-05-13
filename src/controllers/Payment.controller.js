import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import express from "express";
import axios from "axios";

const router = express.Router();

const RAZORPAY_API_KEY = process.env.RAZORPAY_API_KEY;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

export const capturePayment = async (req, res) => {
  console.log("Incoming capture request:", req.body);

  try {
    // Validate required fields
    const requiredFields = ["paymentId", "amount", "ENVIT_ID", "cate_id"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Prepare database record
    const paymentRecord = {
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
