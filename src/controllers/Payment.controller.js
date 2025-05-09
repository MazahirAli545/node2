// import { PrismaClient } from "@prisma/client";
// import prisma from "../db/prismaClient.js";
// import express from "express";
// import axios from "axios"; // Added missing axios import

// const router = express.Router();

// // Make sure these environment variables are correctly set
// const RAZORPAY_API_KEY =
//   process.env.RAZORPAY_API_KEY || "rzp_test_ANawZDTfnQ7fjY"; // Fallback to the key used in frontend
// const RAZORPAY_SECRET_KEY =
//   process.env.RAZORPAY_SECRET_KEY || "wLd92JBcxtJbGVh0GWCToYYx"; // You need to replace this with your actual test secret key

// export const capturePayment = async (req, res) => {
//   const { paymentId, amount, ENVT_ID, PR_FULL_NAME } = req.body;

//   console.log(
//     "Capture request received for payment:",
//     paymentId,
//     "Amount:",
//     amount
//   );

//   try {
//     // Basic Authorization header for Razorpay API
//     const auth = {
//       username: RAZORPAY_API_KEY,
//       password: RAZORPAY_SECRET_KEY,
//     };

//     console.log("Using API Key:", RAZORPAY_API_KEY);
//     // Don't log the full secret key in production, just a hint
//     console.log(
//       "Using Secret Key starting with:",
//       RAZORPAY_SECRET_KEY.substring(0, 3) + "..."
//     );

//     const amountInPaise = Math.round(parseFloat(amount) * 100);
//     console.log("Amount in paise:", amountInPaise);

//     const response = await axios({
//       method: "POST",
//       url: `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
//       auth: auth,
//       headers: {
//         "Content-Type": "application/json",
//       },
//       data: {
//         amount: amountInPaise,
//         currency: "INR",
//       },
//     });

//     console.log("Razorpay API response:", response.data);
//     const paymentData = response.data;
//     const amountInRuppes = paymentData.amount / 100;

//     const paymentRecord = {
//       ENVIT_ID: parseInt(ENVIT_ID),
//       PR_FULL_NAME: PR_FULL_NAME,
//       paymentId: paymentData.id,
//       entity: paymentData.entity,
//       amount: amountInRupees,
//       currency: paymentData.currency,
//       status: paymentData.status,
//       order_id: paymentData.order_id ? parseInt(paymentData.order_id) : null,
//       invoice_id: paymentData.invoice_id
//         ? parseInt(paymentData.invoice_id)
//         : null,
//       international: paymentData.international ? 1 : 0,
//       method: paymentData.method,
//       amount_refunded: paymentData.amount_refunded || 0,
//       refund_status: paymentData.refund_status ? 1 : 0,
//       captured: paymentData.captured,
//       description: paymentData.description || "",
//       bank: paymentData.bank ? 1 : 0,
//       wallet: paymentData.wallet ? 1 : 0,
//       vpa: paymentData.vpa ? 1 : 0,
//       email: paymentData.email || "",
//       contact: paymentData.contact || "",
//       fee: paymentData.fee || 0,
//       tax: paymentData.tax || 0,
//       error_code: paymentData.error_code || "",
//       error_description: paymentData.error_description || "",
//       error_source: paymentData.error_source || "",
//       error_step: paymentData.error_step || "",
//       error_reason: paymentData.error_reason || "",
//       JSON_LOG: JSON.stringify(paymentData),
//     };
//     const savedPayment = await prisma.donationPayment.create({
//       data: {
//         paymentRecord,
//       },
//     });

//     console.log("Payment saved to database:", savedPayment);

//     res.status(200).json({
//       success: true,
//       message: "Payment captured successfully",
//       data: savedPayment,
//     });
//   } catch (error) {
//     console.error("Capture error:", error.message);
//     console.error("Error response data:", error.response?.data);
//     console.error("Error stack:", error.stack);

//     res.status(500).json({
//       success: false,
//       error: error.response?.data || "Payment capture failed",
//     });
//   }
// };

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
    const requiredFields = ["paymentId", "amount", "ENVIT_ID"];
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
      // email: req.body.email || "",
      contact: req.body.contact || "",
      fee: req.body.fee || 0,
      tax: req.body.tax || 0,
      error_code: req.body.error_code || "",
      error_description: req.body.error_description || "",
      error_source: req.body.error_source || "",
      error_step: req.body.error_step || "",
      error_reason: req.body.error_reason || "",
      JSON_LOG: req.body.JSON_LOG || JSON.stringify(req.body),
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
