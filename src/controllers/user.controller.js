import { PrismaClient } from "@prisma/client/extension";
import { verifyFunc, verifyotp, generateotp } from "./otp.controller.js";
import prisma from "../db/prismaClient.js";
import { z } from "zod";
import twilio from "twilio";
import dotenv from "dotenv";
import otpGenerator from "otp-generator";
import { generateToken } from "../middlewares/jwt.js";

dotenv.config();

const twillo_Phone_Number = +16203019559;

const twilioClient = twilio(
  process.env.Twillo_Account_SID,
  process.env.Twillo_Auth_Token
);

const checkMobileVerified = async (PR_MOBILE_NO, otp) => {
  const success = await verifyFunc(PR_MOBILE_NO, otp);

  console.log("User Registered ", success);
  return success;
};

export const registerUser = async (req, res) => {
  try {
    const {
      PR_UNIQUE_ID,
      PR_FULL_NAME,
      PR_DOB,
      PR_GENDER,
      PR_MOBILE_NO,
      PR_PROFESSION_ID,
      PR_PROFESSION,
      PR_PROFESSION_DETA,
      PR_EDUCATION,
      PR_EDUCATION_DESC,
      PR_ADDRESS,
      PR_PIN_CODE,
      PR_CITY_CODE,
      PR_CITY_NAME,
      PR_STATE_NAME,
      PR_STATE_CODE,
      PR_DISTRICT_NAME,
      PR_DISTRICT_CODE,
      PR_FATHER_ID,
      PR_MOTHER_ID,
      PR_SPOUSE_ID,
      PR_FATHER_NAME,
      PR_MOTHER_NAME,
      PR_SPOUSE_NAME,
      PR_PHOTO_URL,
      // otp,
      otp = "1234",
      Children,
    } = req.body;

    console.log("-------reqbody------", req.body);

    const existingmobile = await prisma.peopleRegistry.findFirst({
      where: { PR_MOBILE_NO },
    });

    if (existingmobile) {
      return res.status(400).json({
        message: "this mobile Number is already registered",
        success: false,
      });
    }

    const mobileNumberSchema = z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid mobile number");

    const validateResult = mobileNumberSchema.safeParse(PR_MOBILE_NO);

    if (!validateResult.success) {
      return res
        .status(400)
        .json({ message: "Invalid Mobile Number", success: false });
    }

    const isMobileVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
    console.log(PR_MOBILE_NO, otp);
    if (!isMobileVerified) {
      return res.status(400).json({
        message: "Please verify your mobile number first",
        success: false,
      });
    }

    // const city = await prisma.city.create({
    //   data: {
    //     CITY_PIN_CODE: PR_PIN_CODE,
    //     CITY_NAME: PR_CITY_NAME,
    //     CITY_DS_CODE: PR_DISTRICT_CODE,
    //     CITY_DS_NAME: PR_DISTRICT_NAME,
    //     CITY_ST_CODE: PR_STATE_CODE,
    //     CITY_ST_NAME: PR_STATE_NAME,

    //   },
    // });

    // await prisma.city.update({
    //   where: { CITY_ID: city.CITY_ID },
    //   data: { CITY_CODE: city.CITY_ID },
    // });

    // console.log("rrrr", city);

    let city = await prisma.city.findFirst({
      where: {
        CITY_NAME: PR_CITY_NAME,
        CITY_DS_CODE: PR_DISTRICT_CODE,
        CITY_ST_CODE: PR_STATE_CODE,
      },
    });

    if (!city) {
      city = await prisma.city.create({
        data: {
          CITY_PIN_CODE: PR_PIN_CODE,
          CITY_NAME: PR_CITY_NAME,
          CITY_DS_CODE: PR_DISTRICT_CODE,
          CITY_DS_NAME: PR_DISTRICT_NAME,
          CITY_ST_CODE: PR_STATE_CODE,
          CITY_ST_NAME: PR_STATE_NAME,
          // areas: JSON.stringify(areas), // Store areas as a JSON string
        },
      });

      await prisma.city.update({
        where: { CITY_ID: city.CITY_ID },
        data: { CITY_CODE: city.CITY_ID },
      });
    }

    console.log("City Created/Fetched: ", city);

    const newUser = await prisma.peopleRegistry.create({
      data: {
        PR_UNIQUE_ID: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${
          city.CITY_ID
        }-${"001"}-${"001"}`,
        PR_FULL_NAME,
        PR_DOB: new Date(PR_DOB),
        PR_MOBILE_NO,
        PR_GENDER,
        PR_PROFESSION_ID,
        PR_PROFESSION,
        PR_PROFESSION_DETA,
        PR_EDUCATION,
        PR_EDUCATION_DESC,
        PR_ADDRESS,
        PR_PIN_CODE,
        PR_CITY_CODE: city.CITY_ID,
        PR_STATE_CODE,
        PR_DISTRICT_CODE,
        PR_FATHER_ID,
        PR_MOTHER_ID,
        PR_SPOUSE_ID,
        PR_FATHER_NAME,
        PR_MOTHER_NAME,
        PR_SPOUSE_NAME,
        PR_PHOTO_URL,
      },
    });

    if (Array.isArray(Children) && Children.length > 0) {
      const childPromises = Children.filter(
        (child) => child.name && child.dob
      ).map(async (child) => {
        return prisma.child.create({
          data: {
            name: child.name,
            dob: new Date(child.dob),
            userId: newUser.PR_ID,
          },
        });
      });
      // console.log("Childrennsssssss", Children)
      await Promise.all(childPromises);
    }

    const childrens = await prisma.child.findMany();

    console.log(childrens);

    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: newUser.PR_ID },
      include: { Children: true },
    });

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error registering User:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};

export const LoginUser = async (req, res) => {
  try {
    const { PR_MOBILE_NO } = req.body;

    const existingUser = await prisma.peopleRegistry.findFirst({
      where: { PR_MOBILE_NO },
    });

    if (!existingUser) {
      return res.status(400).json({
        message: "This mobile number is not registered",
        success: false,
      });
    }

    // Generate OTP
    const otp = otpGenerator.generate(4, {
      digits: true,
      specialChars: false,
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
    });

    // Store OTP in the database
    await prisma.otp.upsert({
      where: { PR_MOBILE_NO },
      update: { otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
      create: {
        PR_MOBILE_NO,
        otp,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
      },
    });

    // Send OTP via SMS using Twilio
    await twilioClient.messages.create({
      body: `Your Rangrez App Verification OTP is: ${otp}. It is valid for 2 minutes.`,
      from: twillo_Phone_Number,
      to: `+91${PR_MOBILE_NO}`,
    });

    console.log(`OTP sent to ${PR_MOBILE_NO}: ${otp}`);

    const token = generateToken(existingUser);

    return res
      .status(200)
      .json({ message: "OTP sent successfully", success: true, token });
  } catch (error) {
    console.error("Error logging in:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};
