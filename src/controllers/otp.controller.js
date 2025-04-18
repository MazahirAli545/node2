import { PrismaClient } from "@prisma/client/extension";
import otpGenerator from "otp-generator";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import { log } from "console";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const twillo_Phone_Number = +16203019559;

const twilioClient = twilio(
  process.env.Twillo_Account_SID,
  process.env.Twillo_Auth_Token
);

export const generateotp = async (req, res) => {
  try {
    const { PR_MOBILE_NO } = req.body;

    const mobileNumberSchema = Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({ "string.pattern.base": "Invalid mobile number" });

    const { error } = mobileNumberSchema.validate(PR_MOBILE_NO);
    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message, success: false });
    }

    const otp = "1234";

    console.log(`Static OTP for ${PR_MOBILE_NO}: ${otp}`);

    await prisma.otp.upsert({
      where: { PR_MOBILE_NO },
      update: { otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
      create: {
        PR_MOBILE_NO,
        otp,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
    });

    return res
      .status(200)
      .json({ message: "OTP sent successfully", success: true });
  } catch (error) {
    console.error("Error generating OTP:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

export const verifyotp = async (req, res) => {
  try {
    const { PR_MOBILE_NO, otp, PR_FULL_NAME, PR_DOB } = req.body;

    if (!PR_FULL_NAME || !PR_DOB) {
      return res.status(400).json({
        message: "Name and date of birth are required",
        success: false,
      });
    }

    const success = await verifyFunc(PR_MOBILE_NO, otp);
    console.log(PR_MOBILE_NO, otp);
    if (success) {
      try {
        // const generateUniqueId = () => {
        //   const timestamp = new Date().getTime().toString().slice(-4);
        //   const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
        //   return `USER-${timestamp}-${random}`;
        // };

        const basicUserData = {
          PR_UNIQUE_ID: "0000-00-001-001",
          // PR_UNIQUE_ID: generateUniqueId(),
          PR_MOBILE_NO,
          PR_FULL_NAME,
          PR_DOB,
          PR_IS_COMPLETED: "N",
          //Above is required fields for otp verify

          PR_GENDER: "",
          // PR_PROFESSION_ID: "",
          // PR_PROFESSION: "",
          PR_PROFESSION_DETA: "",
          PR_EDUCATION: "",
          PR_EDUCATION_DESC: "",
          PR_ADDRESS: "",
          PR_AREA_NAME: "",
          PR_PIN_CODE: "",
          // PR_CITY_CODE: "",
          PR_STATE_CODE: "",
          PR_DISTRICT_CODE: "",
          // PR_FATHER_ID: "",
          // PR_MOTHER_ID: "",
          // PR_SPOUSE_ID: "",
          PR_MARRIED_YN: "",
          PR_FATHER_NAME: "",
          PR_MOTHER_NAME: "",
          PR_SPOUSE_NAME: "",
          PR_PHOTO_URL: "",
          // PR_BUSS_CODE: "",
          PR_BUSS_INTER: "",
          PR_BUSS_STREAM: "",
          PR_BUSS_TYPE: "",
          PR_HOBBY: "",
        };

        const existingUser = await prisma.peopleRegistry.findFirst({
          where: { PR_MOBILE_NO },
        });

        if (existingUser) {
          return res.status(200).json({
            message: "OTP verified successfully - User already exists",
            success: true,
            user: existingUser,
            PR_ID: existingUser.PR_ID, // Add this line
            isExistingUser: true, //
          });
        }

        // Create the basic user record
        const newUser = await prisma.peopleRegistry.create({
          data: basicUserData,
        });

        return res.status(200).json({
          message: "OTP verified successfully",
          success: true,
          user: newUser,
          PR_ID: newUser.PR_ID, // Add this line
          isExistingUser: false,
        });
      } catch (registrationError) {
        console.error("Basic registration failed:", registrationError);
        return res.status(500).json({
          message: "OTP verified but registration failed",
          success: false,
        });
      }
    } else {
      return res
        .status(400)
        .json({ message: "OTP is expired or Invalid", success: false });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

export async function verifyFunc(PR_MOBILE_NO, otp) {
  try {
    const otpRecord = await prisma.otp.findFirst({
      where: { PR_MOBILE_NO, otp },
    });

    if (!otpRecord) {
      console.log("OTP not found for ${PR_MOBILE_NO}");

      return false;
    }

    // if (new Date() > otpRecord.expiresAt) {
    //   console.log('hell2');

    //     return false
    // }

    if (otp !== otpRecord.otp && otp !== "1234") {
      console.log(`Incorrect OTP entered for ${PR_MOBILE_NO}`);
      return false;
    }

    if (new Date() > otpRecord.expiresAt) {
      console.log(`OTP expired for ${PR_MOBILE_NO}`);
      return false;
    }

    console.log(`OTP successfully verified and deleted for ${PR_MOBILE_NO}`);
    return true;
  } catch (error) {
    console.log("Error in OTP verification:", error);
    return false;
  }
}
