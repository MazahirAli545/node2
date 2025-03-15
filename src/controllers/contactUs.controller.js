import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import dotenv from "dotenv";
import { generateToken } from "../middlewares/jwt.js";
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

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

    //   const existingmobile = await prisma.peopleRegistry.findFirst({
    //     where: { CON_MOBILE_NO },
    //   });

    //   if(existingmobile){
    //       return res.status(400).json({message: "this mobile Number is already registered" , success : false})
    //   }

    // const mobileNumberSchema = z
    //   .string()
    //   .regex(/^[6-9]\d{9}$/, "Invalid mobile number");
    const mobileNumberSchema = Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({ "string.pattern.base": "Invalid mobile number" });

    // const { CON_MOBILE_NO, CON_NAME, CON_MORE_DETAIL } = req.body;

    // Validate mobile number
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

    // Handle file attachment
    // let CON_ATTACHMENT = null;
    // if (req.file) {
    //   CON_ATTACHMENT = `/uploads/${req.file.filename}`;
    // }

    // let CON_ATTACHMENT = null;

    // if (!req.file) {
    //   return res
    //     .status(400)
    //     .json({ message: "No file uploaded", success: false });
    // }

    // console.log("File received:", req.file);

    // // Read file from disk
    // const filePath = req.file.path;
    // const fileBuffer = fs.readFileSync(filePath);

    // const formData = new FormData();
    // formData.append("image", fileBuffer, {
    //   filename: req.file.originalname,
    //   contentType: req.file.mimetype,
    // });

    // try {
    //   const uploadResponse = await axios.post(
    //     process.env.HOSTINGER_UPLOAD_API_URL,
    //     formData,
    //     {
    //       headers: {
    //         ...formData.getHeaders(),
    //       },
    //     }
    //   );

    //   if (uploadResponse.data && uploadResponse.data.fileUrl) {
    //     CON_ATTACHMENT = uploadResponse.data.fileUrl;
    //   } else {
    //     throw new Error("Invalid response from Hostinger API");
    //   }
    // } catch (uploadError) {
    //   console.error("File upload error:", uploadError);
    //   return res.status(500).json({
    //     message: "File upload failed",
    //     success: false,
    //   });
    // }

    let CON_ATTACHMENT = null;

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No file uploaded", success: false });
    }

    console.log("File received:", req.file);

    // Read file from disk as a stream
    const filePath = req.file.path;
    const formData = new FormData();
    formData.append("image", fs.createReadStream(filePath), {
      filename: req.file.originalname, // Preserve original filename
      contentType: req.file.mimetype, // Include MIME type
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

      console.log("📤 Upload API Response:", uploadResponse.data); // Debug response

      // ✅ Check if API response contains 'status: success'
      if (uploadResponse.data && uploadResponse.data.status === "success") {
        CON_ATTACHMENT = ` process.env.HOSTINGER_UPLOAD_API_URL${uploadResponse.data.url}`;
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

    const newContact = await prisma.contact.create({
      data: {
        CON_TYPE,
        CON_NAME,
        CON_MOBILE_NO,
        CON_ATTACHMENT,
        CON_MORE_DETAIL,
        CON_RATING,
        CON_ACTIVE_YN,
        CON_CREATED_BY: req.userId,
        CON_UPDATED_BY,
        CON_UPDATED_DT,
      },
    });

    console.log("2q3q2we", newContact);

    const contact = await prisma.contact.findUnique({
      where: { CON_ID: newContact.CON_ID },
    });

    return res.status(201).json({
      message: "Contact form has been successfully submitted",
      success: true,
    });
  } catch (error) {
    console.log("Error for contact form submission:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};
