import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const STATIC_OTP = "1234"; // hardcoded for now

// Generate OTP for user
export const generateUserOtp = async (req, res) => {
  try {
    const { PR_MOBILE_NO } = req.body;

    const schema = Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({ "string.pattern.base": "Invalid mobile number" });

    const { error } = schema.validate(PR_MOBILE_NO);
    if (error) {
      return res.status(400).json({ message: error.details[0].message, success: false });
    }

    const otp = STATIC_OTP;
    console.log(`Generated OTP for user ${PR_MOBILE_NO}: ${otp}`);

    await prisma.otp.upsert({
      where: { PR_MOBILE_NO },
      update: { otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
      create: { PR_MOBILE_NO, otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
    });

    return res.status(200).json({ message: "OTP sent successfully", success: true });
  } catch (err) {
    console.error("Generate OTP Error:", err);
    return res.status(500).json({ message: "Something went wrong", success: false });
  }
};

// Verify OTP and register user
export const verifyUserOtp = async (req, res) => {
  try {
    const { PR_MOBILE_NO, otp, PR_FULL_NAME } = req.body;

    const schema = Joi.object({
      PR_MOBILE_NO: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
      otp: Joi.string().required(),
      PR_FULL_NAME: Joi.string().min(1).max(100).required(),
    });

    const { error } = schema.validate({ PR_MOBILE_NO, otp, PR_FULL_NAME });
    if (error) {
      return res.status(400).json({ message: error.details[0].message, success: false });
    }

    const otpRecord = await prisma.Otp.findFirst({
      where: { PR_MOBILE_NO, otp },
    });

    if (!otpRecord || otp !== STATIC_OTP) {
      return res.status(400).json({ message: "Invalid OTP", success: false });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ message: "OTP expired", success: false });
    }

    const existingUser = await prisma.peopleRegistry.findFirst({
      where: { PR_MOBILE_NO },
    });

    let user;
    if (existingUser) {
      user = await prisma.peopleRegistry.update({
        where: { PR_ID: existingUser.PR_ID },
        data: { PR_FULL_NAME },
      });
    } else {
      user = await prisma.peopleRegistry.create({
        data: { PR_FULL_NAME, PR_MOBILE_NO },
      });
    }

    return res.status(200).json({
      message: "User registered successfully",
      success: true,
      user,
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  }
};
