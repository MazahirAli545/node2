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

const RAZORPAY_API_KEY =
  process.env.RAZORPAY_API_KEY || "rzp_test_ANawZDTfnQ7fjY";
const RAZORPAY_SECRET_KEY =
  process.env.RAZORPAY_SECRET_KEY || "wLd92JBcxtJbGVh0GWCToYYx";

export const capturePayment = async (req, res) => {
  console.log("Incoming capture request:", req.body);

  const {
    paymentId,
    amount,
    ENVIT_ID,
    PR_FULL_NAME,
    // ... other fields
    JSON_LOG,
  } = req.body;

  // Basic validation
  if (!paymentId || !amount) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: paymentId and amount are required",
    });
  }

  try {
    // 1. First capture payment with Razorpay
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    console.log("Attempting to capture payment with Razorpay...");

    const razorpayResponse = await axios({
      method: "POST",
      url: `https://api.razorpay.com/v1/payments/${paymentId}/capture`,
      auth: {
        username: RAZORPAY_API_KEY,
        password: RAZORPAY_SECRET_KEY,
      },
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        amount: amountInPaise,
        currency: "INR",
      },
    });

    console.log("Razorpay capture successful:", razorpayResponse.data);
    const paymentData = razorpayResponse.data;

    // 2. Save to database
    console.log("Attempting to save payment to database...");

    const paymentRecord = {
      ENVIT_ID: parseInt(ENVIT_ID) || 0,
      PR_FULL_NAME: PR_FULL_NAME || "",
      paymentId: paymentData.id,
      entity: paymentData.entity || "payment",
      amount: paymentData.amount / 100, // convert to rupees
      currency: paymentData.currency || "INR",
      status: paymentData.status || "captured",
      order_id: paymentData.order_id ? parseInt(paymentData.order_id) : null,
      invoice_id: paymentData.invoice_id
        ? parseInt(paymentData.invoice_id)
        : null,
      international: paymentData.international ? 1 : 0,
      method: paymentData.method || "",
      amount_refunded: paymentData.amount_refunded || 0,
      refund_status: paymentData.refund_status ? 1 : 0,
      captured: paymentData.captured || false,
      description: paymentData.description || "",
      bank: paymentData.bank ? 1 : 0,
      wallet: paymentData.wallet ? 1 : 0,
      vpa: paymentData.vpa ? 1 : 0,
      email: paymentData.email || "",
      contact: paymentData.contact || "",
      fee: paymentData.fee || 0,
      tax: paymentData.tax || 0,
      error_code: paymentData.error_code || "",
      error_description: paymentData.error_description || "",
      error_source: paymentData.error_source || "",
      error_step: paymentData.error_step || "",
      error_reason: paymentData.error_reason || "",
      JSON_LOG: JSON_LOG || JSON.stringify(paymentData),
    };

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
    console.error("Full error:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack,
    });

    let errorMessage = "Payment capture failed";
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.description || errorMessage;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || null,
    });
  }
};
