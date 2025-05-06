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

  try {
    // Validate required fields
    const requiredFields = ["paymentId", "amount"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Extract payment info from request body
    const { paymentId, amount, ENVIT_ID, entity, currency, status, method } =
      req.body;

    // Get payment data from JSON_LOG if available or create minimal data
    let paymentData;
    if (req.body.JSON_LOG) {
      try {
        paymentData = JSON.parse(req.body.JSON_LOG);
      } catch (e) {
        console.error("Failed to parse JSON_LOG:", e);
        paymentData = null;
      }
    }

    // If no parsed data is available, use minimal data
    if (!paymentData) {
      // Convert amount to paise for storage
      const amountInPaise = Math.round(parseFloat(amount) * 100);

      // Create minimal payment record
      const paymentRecord = {
        paymentId: paymentId,
        amount: amountInPaise, // Store in paise in database
        currency: currency || "INR",
        status: status || "captured",
        method: method || "card",
        entity: entity || "payment",
        captured: true,
        JSON_LOG:
          req.body.JSON_LOG ||
          JSON.stringify({
            id: paymentId,
            amount: amountInPaise,
            currency: currency || "INR",
            status: status || "captured",
            method: method || "card",
          }),
      };

      if (ENVIT_ID) {
        paymentRecord.ENVIT_ID = parseInt(ENVIT_ID);
      }

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
    } else {
      // For parsed JSON_LOG data
      const paymentRecord = {
        paymentId: paymentData.id,
        amount: paymentData.amount, // Already in paise from Razorpay
        currency: paymentData.currency,
        status: paymentData.status,
        method: paymentData.method,
        entity: paymentData.entity,
        captured: paymentData.captured || false,
        JSON_LOG: req.body.JSON_LOG,
      };

      // Only add fields that exist in the schema
      if (ENVIT_ID) {
        paymentRecord.ENVIT_ID = parseInt(ENVIT_ID);
      }

      if (paymentData.order_id) {
        paymentRecord.order_id = paymentData.order_id;
      }

      if (paymentData.invoice_id) {
        paymentRecord.invoice_id = paymentData.invoice_id;
      }

      if (paymentData.description) {
        paymentRecord.description = paymentData.description;
      }

      if (paymentData.email) {
        paymentRecord.email = paymentData.email;
      }

      if (paymentData.contact) {
        paymentRecord.contact = paymentData.contact;
      }

      console.log("Creating payment record from JSON_LOG:", paymentRecord);

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
    }
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
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
