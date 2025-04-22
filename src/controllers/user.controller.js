import { PrismaClient } from "@prisma/client/extension";
import { verifyFunc, verifyotp, generateotp } from "./otp.controller.js";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
// import { z } from require("zod");
import Joi from "joi";
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

// export const registerUser = async (req, res) => {
//   try {
//     const {
//       PR_UNIQUE_ID,
//       PR_FULL_NAME,
//       PR_DOB,
//       PR_GENDER,
//       PR_MOBILE_NO,
//       PR_PROFESSION_ID,
//       PR_PROFESSION,
//       PR_PROFESSION_DETA,
//       PR_EDUCATION,
//       PR_EDUCATION_DESC,
//       PR_ADDRESS,
//       PR_AREA_NAME,
//       PR_PIN_CODE,
//       PR_CITY_CODE,
//       PR_CITY_NAME,
//       PR_STATE_NAME,
//       PR_STATE_CODE,
//       PR_DISTRICT_NAME,
//       PR_DISTRICT_CODE,
//       PR_FATHER_ID,
//       PR_MOTHER_ID,
//       PR_SPOUSE_ID,
//       PR_MARRIED_YN,
//       PR_FATHER_NAME,
//       PR_MOTHER_NAME,
//       PR_SPOUSE_NAME,
//       PR_PHOTO_URL,
//       PR_IS_COMPLETED,

//       PR_BUSS_INTER,
//       PR_BUSS_STREAM,
//       PR_BUSS_TYPE,
//       PR_HOBBY,
//       // otp,
//       otp = "1234",
//       Children,
//     } = req.body;

//     console.log("-------reqbody------", req.body);

//     // const existingmobile = await prisma.peopleRegistry.findFirst({
//     //   where: { PR_MOBILE_NO },
//     // });

//     // if (existingmobile) {
//     //   return res.status(400).json({
//     //     message: "this mobile Number is already registered",
//     //     success: false,
//     //   });
//     // }

//     const mobileNumberSchema = Joi.string()
//       .pattern(/^[6-9]\d{9}$/)
//       .required()
//       .messages({ "string.pattern.base": "Invalid mobile number" });

//     const { error } = mobileNumberSchema.validate(PR_MOBILE_NO);
//     if (error) {
//       return res
//         .status(400)
//         .json({ message: error.details[0].message, success: false });
//     }

//     const isMobileVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
//     console.log(PR_MOBILE_NO, otp);
//     if (!isMobileVerified) {
//       return res.status(400).json({
//         message: "Please verify your mobile number first",
//         success: false,
//       });
//     }

//     let city = await prisma.city.findFirst({
//       where: {
//         CITY_NAME: PR_CITY_NAME,
//         CITY_DS_CODE: PR_DISTRICT_CODE,
//         CITY_ST_CODE: PR_STATE_CODE,
//       },
//     });

//     if (!city) {
//       city = await prisma.city.create({
//         data: {
//           CITY_PIN_CODE: PR_PIN_CODE,
//           CITY_NAME: PR_CITY_NAME,
//           CITY_DS_CODE: PR_DISTRICT_CODE,
//           CITY_DS_NAME: PR_DISTRICT_NAME,
//           CITY_ST_CODE: PR_STATE_CODE,
//           CITY_ST_NAME: PR_STATE_NAME,
//           // areas: JSON.stringify(areas), // Store areas as a JSON string
//         },
//       });
//     }

//     console.log("City Created/Fetched: ", city);

//     let business = await prisma.bUSSINESS.findFirst({
//       where: {
//         BUSS_STREM: PR_BUSS_STREAM,
//         BUSS_TYPE: PR_BUSS_TYPE,
//       },
//     });

//     if (!business) {
//       business = await prisma.bUSSINESS.create({
//         data: {
//           BUSS_STREM: PR_BUSS_STREAM,
//           BUSS_TYPE: PR_BUSS_TYPE,
//           CITY_CREATED_BY: 1, // Replace this with the actual user ID
//         },
//       });

//       await prisma.bUSSINESS.update({
//         where: { BUSS_ID: business.BUSS_ID },
//         data: { BUSS_ID: business.BUSS_ID }, // Ensuring ID is properly set
//       });
//     }

//     const professionId =
//       PR_PROFESSION_ID && PR_PROFESSION_ID !== 0 ? PR_PROFESSION_ID : null;

//     const isCompleted =
//       PR_FULL_NAME &&
//       PR_DOB &&
//       PR_MOBILE_NO &&
//       PR_PROFESSION &&
//       PR_PROFESSION_DETA &&
//       PR_FATHER_NAME &&
//       PR_MOTHER_NAME
//         ? "Y"
//         : "N";

//     const newUser = await prisma.peopleRegistry.create({
//       data: {
//         PR_UNIQUE_ID: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${
//           city.CITY_ID
//         }-${"001"}-${"001"}`,
//         PR_FULL_NAME,
//         PR_DOB: new Date(PR_DOB).toLocaleDateString(),
//         PR_MOBILE_NO,
//         PR_GENDER,
//         PR_PROFESSION_ID: professionId,
//         PR_PROFESSION,
//         PR_PROFESSION_DETA,
//         PR_EDUCATION,
//         PR_EDUCATION_DESC,
//         PR_ADDRESS,
//         PR_AREA_NAME,
//         PR_PIN_CODE,
//         PR_CITY_CODE: city.CITY_ID,
//         PR_STATE_CODE,
//         PR_DISTRICT_CODE,
//         PR_FATHER_ID,
//         PR_MOTHER_ID,
//         PR_SPOUSE_ID,
//         PR_MARRIED_YN,
//         PR_FATHER_NAME,
//         PR_MOTHER_NAME,
//         PR_SPOUSE_NAME,
//         PR_PHOTO_URL,
//         PR_BUSS_CODE: business.BUSS_ID,
//         PR_BUSS_INTER,
//         PR_BUSS_STREAM,
//         PR_BUSS_TYPE,
//         PR_HOBBY,
//         PR_IS_COMPLETED: isCompleted,
//       },
//     });

//     if (Array.isArray(Children) && Children.length > 0) {
//       const childPromises = Children.filter(
//         (child) => child.name && child.dob
//       ).map(async (child) => {
//         return prisma.child.create({
//           data: {
//             name: child.name,
//             dob: new Date(child.dob),
//             userId: newUser.PR_ID,
//           },
//         });
//       });
//       console.log("Childrennsssssss", Children);
//       await Promise.all(childPromises);
//     }

//     const childrens = await prisma.child.findMany();

//     console.log(childrens);

//     const user = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: newUser.PR_ID },
//       include: { Children: true },
//     });

//     return res.status(201).json({
//       message: "User registered successfully",
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.log("Error registering User:", error);
//     return res.status(500).json({
//       message: "Something went wrong",
//       success: false,
//     });
//   }
// };

export const registerUser = async (req, res) => {
  try {
    const {
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
      PR_AREA_NAME,
      PR_PIN_CODE,
      PR_CITY_NAME,
      PR_STATE_NAME,
      PR_STATE_CODE,
      PR_DISTRICT_NAME,
      PR_DISTRICT_CODE,
      PR_FATHER_ID,
      PR_MOTHER_ID,
      PR_SPOUSE_ID,
      PR_MARRIED_YN,
      PR_FATHER_NAME,
      PR_MOTHER_NAME,
      PR_SPOUSE_NAME,
      PR_PHOTO_URL,
      PR_IS_COMPLETED,
      PR_BUSS_INTER,
      PR_BUSS_STREAM,
      PR_BUSS_TYPE,
      PR_HOBBY,
      otp = "1234",
      Children,
    } = req.body;

    console.log("-------reqbody------", req.body);

    // Validate mobile number
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

    // Verify mobile OTP
    const isMobileVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
    if (!isMobileVerified) {
      return res.status(400).json({
        message: "Please verify your mobile number first",
        success: false,
      });
    }

    // Find or create city - now including CITY_CODE in the query
    let city = await prisma.city.findFirst({
      where: {
        CITY_NAME: PR_CITY_NAME,
        CITY_DS_CODE: PR_DISTRICT_CODE,
        CITY_ST_CODE: PR_STATE_CODE,
      },
      select: {
        CITY_ID: true,
        CITY_PIN_CODE: true,
        CITY_NAME: true,
        CITY_DS_CODE: true,
        CITY_ST_CODE: true,
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
        },
        select: {
          CITY_ID: true,
          CITY_PIN_CODE: true,
          CITY_NAME: true,
          CITY_DS_CODE: true,
          CITY_ST_CODE: true,
        },
      });
    }

    console.log("City Created/Fetched: ", city);

    // Find or create business
    let business = await prisma.bUSSINESS.findFirst({
      where: {
        BUSS_STREM: PR_BUSS_STREAM,
        BUSS_TYPE: PR_BUSS_TYPE,
      },
    });

    if (!business) {
      business = await prisma.bUSSINESS.create({
        data: {
          BUSS_STREM: PR_BUSS_STREAM,
          BUSS_TYPE: PR_BUSS_TYPE,
          CITY_CREATED_BY: 1,
        },
      });
    }

    const professionId =
      PR_PROFESSION_ID && PR_PROFESSION_ID !== 0 ? PR_PROFESSION_ID : null;

    const isCompleted =
      PR_FULL_NAME &&
      PR_DOB &&
      PR_MOBILE_NO &&
      PR_PROFESSION &&
      PR_PROFESSION_DETA &&
      PR_FATHER_NAME &&
      PR_MOTHER_NAME
        ? "Y"
        : "N";

    // Generate family and member numbers (example logic)
    const familyCount = await prisma.peopleRegistry.count({
      where: {
        PR_FATHER_ID: PR_FATHER_ID || PR_MOTHER_ID || PR_SPOUSE_ID,
      },
    });

    const PR_FAMILY_NO = "001"; // Replace with your actual logic
    const PR_MEMBER_NO = (familyCount + 1).toString().padStart(3, "0");

    // Create user with proper city code handling
    const newUser = await prisma.peopleRegistry.create({
      data: {
        PR_UNIQUE_ID: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${city.CITY_ID}-${PR_FAMILY_NO}-${PR_MEMBER_NO}`,
        PR_FULL_NAME,
        PR_DOB: new Date(PR_DOB).toISOString(),
        PR_MOBILE_NO,
        PR_GENDER,
        PR_PROFESSION_ID: professionId,
        PR_PROFESSION,
        PR_PROFESSION_DETA,
        PR_EDUCATION,
        PR_EDUCATION_DESC,
        PR_ADDRESS,
        PR_AREA_NAME,
        PR_PIN_CODE,
        PR_CITY_CODE: city.CITY_ID, // Setting to city.CITY_ID as per schema relation
        PR_STATE_CODE,
        PR_DISTRICT_CODE,
        PR_FAMILY_NO,
        PR_MEMBER_NO,
        PR_FATHER_ID,
        PR_MOTHER_ID,
        PR_SPOUSE_ID,
        PR_MARRIED_YN,
        PR_FATHER_NAME,
        PR_MOTHER_NAME,
        PR_SPOUSE_NAME,
        PR_PHOTO_URL,
        PR_BUSS_CODE: business?.BUSS_ID,
        PR_BUSS_INTER,
        PR_BUSS_STREAM,
        PR_BUSS_TYPE,
        PR_HOBBY,
        PR_IS_COMPLETED: isCompleted,
      },
    });

    // Handle children records
    if (Array.isArray(Children) && Children.length > 0) {
      await prisma.child.createMany({
        data: Children.filter((child) => child.name && child.dob).map(
          (child) => ({
            name: child.name,
            dob: new Date(child.dob),
            userId: newUser.PR_ID,
          })
        ),
        skipDuplicates: true,
      });
    }

    // Return the complete user data with relations
    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: newUser.PR_ID },
      include: {
        Children: true,
        City: true,
        BUSSINESS: true,
        Profession: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error registering User:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    // const otp = otpGenerator.generate(4, {
    //   digits: true,
    //   specialChars: false,
    //   upperCaseAlphabets: false,
    //   lowerCaseAlphabets: false,
    // });

    const otp = "1234";

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
    // await twilioClient.messages.create({
    //   body: `Your Rangrez App Verification OTP is: ${otp}. It is valid for 2 minutes.`,
    //   from: twillo_Phone_Number,
    //   to: `+91${PR_MOBILE_NO}`,
    // });

    // console.log(`OTP sent to ${PR_MOBILE_NO}: ${otp}`);

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
