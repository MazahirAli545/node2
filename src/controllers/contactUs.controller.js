import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import dotenv from "dotenv";
import { generateToken } from "../middlewares/jwt.js";

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
      .messages({ "string.pattern.base": "Invalid mobile number" });

    const validateResult = mobileNumberSchema.safeParse(CON_MOBILE_NO);

    if (!validateResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid Mobile Number", success: false });
    }

    if (!validateResult) {
      return res.status(400).json({ message: "Mobile Number is Required" });
    }

    if (!CON_NAME) {
      return res.status(400).json({ message: "Name is Required" });
    }

    if (!CON_MORE_DETAIL) {
      return res.status(400).json({ message: "Enter Some Description" });
    }

    let CON_ATTACHMENT = null;
    if (req.file) {
      CON_ATTACHMENT = `/uploads/${req.file.filename}`; // Store file path
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
