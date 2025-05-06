import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import express from "express";
import axios from "axios"; // Added missing axios import

const router = express.Router();

// Make sure these environment variables are correctly set
const RAZORPAY_API_KEY =
  process.env.RAZORPAY_API_KEY || "rzp_test_ANawZDTfnQ7fjY"; // Fallback to the key used in frontend
const RAZORPAY_SECRET_KEY =
  process.env.RAZORPAY_SECRET_KEY || "wLd92JBcxtJbGVh0GWCToYYx"; // You need to replace this with your actual test secret key

export const capturePayment = async (req, res) => {
  const { paymentId, amount } = req.body;

  console.log(
    "Capture request received for payment:",
    paymentId,
    "Amount:",
    amount
  );

  try {
    // Basic Authorization header for Razorpay API
    const auth = {
      username: RAZORPAY_API_KEY,
      password: RAZORPAY_SECRET_KEY,
    };

    console.log("Using API Key:", RAZORPAY_API_KEY);
    // Don't log the full secret key in production, just a hint
    console.log(
      "Using Secret Key starting with:",
      RAZORPAY_SECRET_KEY.substring(0, 3) + "..."
    );

    const amountInPaise = Math.round(parseFloat(amount) * 100);
    console.log("Amount in paise:", amountInPaise);

    const response = await axios({
      method: "POST",
      url: `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
      auth: auth,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        amount: amountInPaise,
        currency: "INR",
      },
    });

    console.log("Razorpay API response:", response.data);
    const paymentData = response.data;
    const amountInRuppes = paymentData.amount / 100;
    const savedPayment = await prisma.donationPayment.create({
      data: {
        PR_ID,
        PR_FULL_NAME,
        paymentId: paymentData.id,
        amount: amountInRuppes,
        currency: paymentData.currency,
        status: paymentData.status,
        method: paymentData.method,
        captured: paymentData.captured,
      },
    });

    console.log("Payment saved to database:", savedPayment);

    res.status(200).json({
      success: true,
      message: "Payment captured successfully",
      data: savedPayment,
    });
  } catch (error) {
    console.error("Capture error:", error.message);
    console.error("Error response data:", error.response?.data);
    console.error("Error stack:", error.stack);

    res.status(500).json({
      success: false,
      error: error.response?.data || "Payment capture failed",
    });
  }
};
