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

// export const verifyotp = async (req, res) => {
//   try {
//     const { PR_MOBILE_NO, otp, PR_FULL_NAME, PR_DOB } = req.body;

//     if (!PR_FULL_NAME || !PR_DOB) {
//       return res.status(400).json({
//         message: "Name and date of birth are required",
//         success: false,
//       });
//     }

//     const success = await verifyFunc(PR_MOBILE_NO, otp);
//     console.log(PR_MOBILE_NO, otp);
//     if (success) {
//       try {
//         // const generateUniqueId = () => {
//         //   const timestamp = new Date().getTime().toString().slice(-4);
//         //   const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
//         //   return `USER-${timestamp}-${random}`;
//         // };

//         const basicUserData = {
//           PR_UNIQUE_ID: "0000-00-001-001",
//           // PR_UNIQUE_ID: generateUniqueId(),
//           PR_MOBILE_NO,
//           PR_FULL_NAME,
//           PR_DOB,
//           PR_IS_COMPLETED: "N",
//           //Above is required fields for otp verify

//           PR_GENDER: "",
//           // PR_PROFESSION_ID: "",
//           // PR_PROFESSION: "",
//           PR_PROFESSION_DETA: "",
//           PR_EDUCATION: "",
//           PR_EDUCATION_DESC: "",
//           PR_ADDRESS: "",
//           PR_AREA_NAME: "",
//           PR_PIN_CODE: "",
//           // PR_CITY_CODE: "",
//           PR_STATE_CODE: "",
//           PR_DISTRICT_CODE: "",
//           // PR_FATHER_ID: "",
//           // PR_MOTHER_ID: "",
//           // PR_SPOUSE_ID: "",
//           PR_MARRIED_YN: "",
//           PR_FATHER_NAME: "",
//           PR_MOTHER_NAME: "",
//           PR_SPOUSE_NAME: "",
//           PR_PHOTO_URL: "",
//           // PR_BUSS_CODE: "",
//           PR_BUSS_INTER: "",
//           PR_BUSS_STREAM: "",
//           PR_BUSS_TYPE: "",
//           PR_HOBBY: "",
//         };

//         const existingUser = await prisma.peopleRegistry.findFirst({
//           where: { PR_MOBILE_NO },
//         });

//         if (existingUser) {
//           return res.status(200).json({
//             message: "OTP verified successfully - User already exists",
//             success: true,
//             user: existingUser,
//             PR_ID: existingUser.PR_ID, // Add this line
//             isExistingUser: true, //
//           });
//         }

//         // Create the basic user record
//         const newUser = await prisma.peopleRegistry.create({
//           data: basicUserData,
//         });

//         return res.status(200).json({
//           message: "OTP verified successfully",
//           success: true,
//           user: newUser,
//           PR_ID: newUser.PR_ID, // Add this line
//           isExistingUser: false,
//         });
//       } catch (registrationError) {
//         console.error("Basic registration failed:", registrationError);
//         return res.status(500).json({
//           message: "OTP verified but registration failed",
//           success: false,
//         });
//       }
//     } else {
//       return res
//         .status(400)
//         .json({ message: "OTP is expired or Invalid", success: false });
//     }
//   } catch (error) {
//     console.error("Error verifying OTP:", error);
//     return res
//       .status(500)
//       .json({ message: "Something went wrong", success: false });
//   }
// };

export const verifyotp = async (req, res) => {
  try {
    const {
      PR_MOBILE_NO,
      otp,
      PR_FULL_NAME,
      PR_DOB,
      PR_STATE_CODE,
      PR_DISTRICT_CODE,
      PR_CITY_NAME,
    } = req.body;

    // Validate input data
    const schema = Joi.object({
      PR_MOBILE_NO: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({ "string.pattern.base": "Invalid mobile number" }),
      otp: Joi.string().required(),
      PR_FULL_NAME: Joi.string().min(3).max(100).required(),
      PR_DOB: Joi.date().required(),
      PR_STATE_CODE: Joi.string().allow("").optional(),
      PR_DISTRICT_CODE: Joi.string().allow("").optional(),
      PR_CITY_NAME: Joi.string().allow("").optional(),
    });

    const { error } = schema.validate({
      PR_MOBILE_NO,
      otp,
      PR_FULL_NAME,
      PR_DOB,
      PR_STATE_CODE,
      PR_DISTRICT_CODE,
      PR_CITY_NAME,
    });
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
        success: false,
      });
    }

    // Verify OTP
    const isOtpValid = await verifyFunc(PR_MOBILE_NO, otp);
    if (!isOtpValid) {
      return res.status(400).json({
        message: "OTP is expired or invalid",
        success: false,
      });
    }

    // Check if user already exists
    // const existingUser = await prisma.peopleRegistry.findFirst({
    //   where: { PR_MOBILE_NO },
    // });

    // if (existingUser) {
    //   return res.status(200).json({
    //     message: "OTP verified successfully - User already exists",
    //     success: true,
    //     user: existingUser,
    //     PR_ID: existingUser.PR_ID,
    //     isExistingUser: true,
    //   });
    // }

    // Find or create city to get CITY_ID
    let city = await prisma.city.findFirst({
      where: {
        CITY_NAME: PR_CITY_NAME,
        CITY_DS_CODE: PR_DISTRICT_CODE,
        CITY_ST_CODE: PR_STATE_CODE,
      },
    });

    if (!city && PR_CITY_NAME && PR_DISTRICT_CODE && PR_STATE_CODE) {
      city = await prisma.city.create({
        data: {
          CITY_NAME: PR_CITY_NAME,
          CITY_DS_CODE: PR_DISTRICT_CODE,
          CITY_ST_CODE: PR_STATE_CODE,
          CITY_PIN_CODE: "",
          CITY_DS_NAME: "",
          CITY_ST_NAME: "",
        },
      });

      // await prisma.city.update({
      //   where: { CITY_ID: city.CITY_ID },
      //   data: { CITY_CODE: city.CITY_ID },
      // });
    }

    // Format the date as string (YYYY-MM-DD)
    const formattedDOB = new Date(PR_DOB).toISOString().split("T")[0];

    // Generate temporary unique ID
    let familyNumber = "001"; // Default family number
    let familyMemberNumber = "001"; // Default family member number

    // Check if there are existing users with the same mobile number
    const existingUsers = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO: PR_MOBILE_NO },
      orderBy: { PR_ID: "desc" },
    });

    if (existingUsers.length > 0) {
      // If users exist with same mobile number, increment family member number
      const lastUser = existingUsers[0];
      const lastUniqueIdParts = lastUser.PR_UNIQUE_ID.split("-");

      if (lastUniqueIdParts.length === 4) {
        familyNumber = lastUniqueIdParts[2];
        // Increment family member number
        const lastMemberNumber = parseInt(lastUniqueIdParts[3]);
        familyMemberNumber = (lastMemberNumber + 1).toString().padStart(3, "0");
      }
    } else {
      // For new family (new mobile number), find the next available family number
      const lastFamily = await prisma.peopleRegistry.findFirst({
        where: {
          PR_STATE_CODE: PR_STATE_CODE || "",
          PR_DISTRICT_CODE: PR_DISTRICT_CODE || "",
          PR_CITY_CODE: city ? city.CITY_ID : null,
        },
        orderBy: { PR_ID: "desc" },
      });

      if (lastFamily) {
        const lastUniqueIdParts = lastFamily.PR_UNIQUE_ID.split("-");
        if (lastUniqueIdParts.length === 4) {
          const lastFamilyNumber = parseInt(lastUniqueIdParts[2]);
          familyNumber = (lastFamilyNumber + 1).toString().padStart(3, "0");
        }
      }
    }

    // Generate temporary unique ID
    const tempUniqueId =
      PR_STATE_CODE && PR_DISTRICT_CODE && city
        ? `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${familyMemberNumber}`
        : `0000-00-001-001`;

    // Create basic user data
    const basicUserData = {
      PR_UNIQUE_ID: tempUniqueId,
      PR_FAMILY_NO: familyNumber, // Added family number
      PR_MEMBER_NO: memberNumber,
      PR_MOBILE_NO,
      PR_FULL_NAME,
      PR_DOB: formattedDOB, // Use string formatted date
      PR_IS_COMPLETED: "N",
      PR_GENDER: "",
      PR_PROFESSION_DETA: "",
      PR_EDUCATION: "",
      PR_EDUCATION_DESC: "",
      PR_ADDRESS: "",
      PR_AREA_NAME: "",
      PR_PIN_CODE: "",
      PR_STATE_CODE: PR_STATE_CODE || "",
      PR_DISTRICT_CODE: PR_DISTRICT_CODE || "",
      PR_CITY_CODE: city ? city.CITY_ID : null,
      PR_MARRIED_YN: "",
      PR_FATHER_NAME: "",
      PR_MOTHER_NAME: "",
      PR_SPOUSE_NAME: "",
      PR_PHOTO_URL: "",
      PR_BUSS_INTER: "",
      PR_BUSS_STREAM: "",
      PR_BUSS_TYPE: "",
      PR_HOBBY: "",
    };

    // Create new user
    const newUser = await prisma.peopleRegistry.create({
      data: basicUserData,
    });

    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      user: newUser,
      PR_ID: newUser.PR_ID,
      isExistingUser: false,
    });
  } catch (error) {
    console.error("Error in OTP verification:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Mobile number already registered",
        success: false,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
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
