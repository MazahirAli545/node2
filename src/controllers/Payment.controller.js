import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
import axios from "axios";
import express from "express";
import dotenv from "dotenv";
const router = express.Router();

const RAZORPAY_API_KEY = process.env.RAZORPAY_API_KEY;
const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

// router.post("/capture")
export const capturePayment = async (req, res) => {
  const { paymentId, amount } = req.body;

  try {
    const response = await axios({
      method: "POST",
      url: `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
      auth: {
        username: RAZORPAY_API_KEY,
        Password: RAZORPAY_SECRET_KEY,
      },
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        amount: amount * 100,
        currency: "INR",
      },
    });
    const paymentData = response.data;

    const savedPayment = await prisma.donationPayment.create({
      data: {
        paymentId: paymentData.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status,
        method: paymentData.method,
        captured: paymentData.captured,
      },
    });
    res.status(200).json({
      success: true,
      message: "Payment captured successfullt",
      data: savedPayment,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || "Payment captured failed",
    });
  }
};
