import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import dotenv from "dotenv";
import { generateToken } from "../middlewares/jwt.js";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

export const getContactForms = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        CON_CREATED_DT: "desc", // optional: show latest first
      },
    });

    return res.status(200).json({
      message: "Contact forms retrieved successfully",
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error("❌ Failed to fetch contact forms:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const contactForm = async (req, res) => {
  try {
    const {
      CON_TYPE,
      CON_NAME,
      CON_MOBILE_NO,
      CON_MORE_DETAIL,
      CON_RATING,
      CON_ACTIVE_YN,
      CON_UPDATED_BY,
      CON_UPDATED_DT,
    } = req.body;

    const mobileNumberSchema = Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({ "string.pattern.base": "Invalid mobile number" });

    const { error } = mobileNumberSchema.validate(CON_MOBILE_NO);
    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    // Check required fields
    if (!CON_NAME) {
      return res
        .status(400)
        .json({ message: "Name is Required", success: false });
    }

    if (!CON_MORE_DETAIL) {
      return res
        .status(400)
        .json({ message: "Enter Some Description", success: false });
    }

    let CON_ATTACHMENT = null;

    if (req.file) {
      console.log("File received:", req.file);

      // Read file from disk as a stream
      const filePath = req.file.path;
      const formData = new FormData();
      formData.append("image", fs.createReadStream(filePath), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      try {
        const uploadResponse = await axios.post(
          process.env.HOSTINGER_UPLOAD_API_URL,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          }
        );

        console.log("📤 Upload API Response:", uploadResponse.data);

        // ✅ Check if API response contains 'status: success'
        if (uploadResponse.data && uploadResponse.data.status === "success") {
          CON_ATTACHMENT = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
          console.log("✅ File uploaded successfully! 📂", CON_ATTACHMENT);
        } else {
          console.error(
            "❌ Unexpected response from Hostinger API:",
            uploadResponse.data
          );
          throw new Error("Invalid response from Hostinger API");
        }
      } catch (uploadError) {
        console.error(
          "❌ File upload error:",
          uploadError.response?.data || uploadError.message
        );
        return res.status(500).json({
          message: "File upload failed",
          success: false,
          error: uploadError.response?.data || uploadError.message, // Include error details
        });
      }
    } else {
      console.log("ℹ️ No file uploaded, proceeding without attachment.");
    }

    const newContact = await prisma.contact.create({
      data: {
        CON_TYPE,
        CON_NAME,
        CON_MOBILE_NO,
        CON_ATTACHMENT, // Can be null if no file uploaded
        CON_MORE_DETAIL,
        // CON_RATING,
        CON_RATING: parseInt(CON_RATING, 10) || 3,
        CON_ACTIVE_YN,
        CON_CREATED_BY: req.userId,
        CON_UPDATED_BY,
        CON_UPDATED_DT,
      },
    });

    console.log("✅ Contact form submitted:", newContact);

    return res.status(201).json({
      message: "Contact form has been successfully submitted",
      success: true,
    });
  } catch (error) {
    console.log("❌ Error for contact form submission:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};
