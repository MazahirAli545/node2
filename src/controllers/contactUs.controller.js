import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import dotenv from "dotenv";
import { generateToken } from "../middlewares/jwt.js";
import { cloudinary } from "../utils/cloudinary.js";

dotenv.config();

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
    //   const uploadResult = await cloudinary.uploader.upload(req.file.path);
    //   CON_ATTACHMENT = uploadResult.secure_url;
    // }
    if (!req.userId)
      return res
        .status(400)
        .json({ message: "User ID is missing", success: false });

    // ✅ Check if `CON_CREATED_BY` Exists in PeopleRegistry
    const userExists = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: req.userId },
    });

    if (!userExists) {
      return res
        .status(400)
        .json({ message: "Invalid user ID", success: false });
    }

    // ✅ Handle File Attachment (Cloudinary Upload)
    let CON_ATTACHMENT = null;
    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path);
        CON_ATTACHMENT = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res
          .status(500)
          .json({ message: "File upload failed", success: false });
      }
    }

    // ✅ Convert `CON_UPDATED_DT` to a Valid Date
    const updatedDate = CON_UPDATED_DT ? new Date(CON_UPDATED_DT) : null;

    const newContact = await prisma.contact.create({
      data: {
        CON_TYPE,
        CON_NAME,
        CON_MOBILE_NO,
        CON_ATTACHMENT,
        CON_MORE_DETAIL,
        CON_RATING,
        CON_ACTIVE_YN,
        CON_CREATED_BY: req.userId || 1, // Set a default valid ID (Ensure ID=1 exists)
        CON_UPDATED_BY: CON_UPDATED_BY || req.userId || 1,
        CON_UPDATED_DT: CON_UPDATED_DT ? new Date(CON_UPDATED_DT) : new Date(),
      },
    });

    console.log("2q3q2we", newContact);

    // const contact = await prisma.contact.findUnique({
    //   where: { CON_ID: newContact.CON_ID },
    // });

    return res.status(201).json({
      message: "Contact form has been successfully submitted",
      success: true,
      contact: newContact,
    });
  } catch (error) {
    console.log("Error for contact form submission:", error);

    if (error instanceof prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({
        message: "Database error: " + error.message,
        success: false,
      });
    }

    return res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
};
