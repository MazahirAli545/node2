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

    const isMobileVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
    console.log(PR_MOBILE_NO, otp);
    if (!isMobileVerified) {
      return res.status(400).json({
        message: "Please verify your mobile number first",
        success: false,
      });
    }

    let city = await prisma.city.findFirst({
      where: {
        CITY_ID: CITY_ID,
      },
    });

    // if (!city) {
    //   city = await prisma.city.create({
    //     data: {
    //       CITY_PIN_CODE: PR_PIN_CODE,
    //       CITY_NAME: PR_CITY_NAME,
    //       CITY_DS_CODE: PR_DISTRICT_CODE,
    //       CITY_DS_NAME: PR_DISTRICT_NAME,
    //       CITY_ST_CODE: PR_STATE_CODE,
    //       CITY_ST_NAME: PR_STATE_NAME,
    //     },
    //   });
    // }

    console.log("City Created/Fetched: ", city);

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

      await prisma.bUSSINESS.update({
        where: { BUSS_ID: business.BUSS_ID },
        data: { BUSS_ID: business.BUSS_ID },
      });
    }

    // Check for existing users with same mobile number
    const existingUsers = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO: PR_MOBILE_NO },
      orderBy: { PR_ID: "desc" },
    });

    let familyNumber = "001";
    let memberNumber = "001";

    if (existingUsers.length > 0) {
      // Check if user with same name exists
      // const existingUserWithSameName = existingUsers.find(
      //   (user) => user.PR_FULL_NAME.toLowerCase() === PR_FULL_NAME.toLowerCase()
      // );

      // if (existingUserWithSameName) {
      //   return res.status(400).json({
      //     message: "User with this mobile and name already exists",
      //     success: false,
      //   });
      // }

      // Get the latest user with this mobile to get family number
      const latestUser = existingUsers[0];
      const existingIdParts = latestUser.PR_UNIQUE_ID.split("-");

      if (existingIdParts.length === 4) {
        familyNumber = existingIdParts[2];
        // Find the highest member number for this family
        const familyMembers = await prisma.peopleRegistry.findMany({
          where: {
            PR_UNIQUE_ID: {
              startsWith: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-`,
            },
          },
        });

        let maxMemberNumber = 0;
        familyMembers.forEach((member) => {
          const parts = member.PR_UNIQUE_ID.split("-");
          if (parts.length === 4) {
            const num = parseInt(parts[3]);
            if (num > maxMemberNumber) maxMemberNumber = num;
          }
        });

        memberNumber = (maxMemberNumber + 1).toString().padStart(3, "0");
      }
    } else {
      // New mobile number - find the next available family number
      const lastUserInArea = await prisma.peopleRegistry.findFirst({
        where: {
          PR_STATE_CODE: PR_STATE_CODE,
          PR_DISTRICT_CODE: PR_DISTRICT_CODE,
          PR_CITY_CODE: city.CITY_ID,
        },
        orderBy: { PR_ID: "desc" },
      });

      if (lastUserInArea) {
        const lastIdParts = lastUserInArea.PR_UNIQUE_ID.split("-");
        if (lastIdParts.length === 4) {
          const lastFamilyNum = parseInt(lastIdParts[2]);
          familyNumber = (lastFamilyNum + 1).toString().padStart(3, "0");
        }
      }
    }

    const professionId =
      PR_PROFESSION_ID && PR_PROFESSION_ID !== 0 ? PR_PROFESSION_ID : null;

    const isCompleted =
      req?.body?.PR_FULL_NAME &&
      req?.body?.PR_DOB &&
      req?.body?.PR_MOBILE_NO &&
      req?.body?.PR_PIN_CODE &&
      req?.body?.PR_AREA_NAME &&
      req?.body?.PR_ADDRESS &&
      req?.body?.PR_FATHER_NAME &&
      req?.body?.PR_MOTHER_NAME
        ? "Y"
        : "N";

    const newUser = await prisma.peopleRegistry.create({
      data: {
        PR_UNIQUE_ID: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${memberNumber}`,
        PR_FULL_NAME,
        PR_DOB: new Date(PR_DOB).toLocaleDateString(),
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
        PR_CITY_CODE: city?.CITY_ID,
        PR_STATE_CODE,
        PR_DISTRICT_CODE,
        PR_FAMILY_NO: familyNumber, // Added family number
        PR_MEMBER_NO: memberNumber, // Added member number

        PR_FATHER_ID,
        PR_MOTHER_ID,
        PR_SPOUSE_ID,
        PR_MARRIED_YN,
        PR_FATHER_NAME,
        PR_MOTHER_NAME,
        PR_SPOUSE_NAME,
        PR_PHOTO_URL,
        PR_BUSS_CODE: business.BUSS_ID,
        PR_BUSS_INTER,
        PR_BUSS_STREAM,
        PR_BUSS_TYPE,
        PR_HOBBY,
        PR_IS_COMPLETED: isCompleted,
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
      console.log("Childrennsssssss", Children);
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

// export const LoginUser = async (req, res) => {
//   try {
//     const { PR_MOBILE_NO } = req.body;

//     const existingUser = await prisma.peopleRegistry.findFirst({
//       where: { PR_MOBILE_NO },
//     });

//     if (!existingUser) {
//       return res.status(400).json({
//         message: "This mobile number is not registered",
//         success: false,
//       });
//     }

//     // Generate OTP
//     // const otp = otpGenerator.generate(4, {
//     //   digits: true,
//     //   specialChars: false,
//     //   upperCaseAlphabets: false,
//     //   lowerCaseAlphabets: false,
//     // });

//     const otp = "1234";

//     // Store OTP in the database
//     await prisma.otp.upsert({
//       where: { PR_MOBILE_NO },
//       update: { otp, expiresAt: new Date(Date.now() + 2 * 60 * 1000) },
//       create: {
//         PR_MOBILE_NO,
//         otp,
//         expiresAt: new Date(Date.now() + 2 * 60 * 1000),
//       },
//     });

//     // Send OTP via SMS using Twilio
//     // await twilioClient.messages.create({
//     //   body: `Your Rangrez App Verification OTP is: ${otp}. It is valid for 2 minutes.`,
//     //   from: twillo_Phone_Number,
//     //   to: `+91${PR_MOBILE_NO}`,
//     // });

//     // console.log(`OTP sent to ${PR_MOBILE_NO}: ${otp}`);

//     const token = generateToken(existingUser);

//     return res
//       .status(200)
//       .json({ message: "OTP sent successfully", success: true, token });
//   } catch (error) {
//     console.error("Error logging in:", error);
//     return res
//       .status(500)
//       .json({ message: "Something went wrong", success: false });
//   }
// };

// export const LoginUser = async (req, res) => {
//   try {
//     const { PR_MOBILE_NO, otp = "1234" } = req.body;

//     // Validate mobile number format
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

//     // Check if user exists
//     const existingUser = await prisma.peopleRegistry.findFirst({
//       where: { PR_MOBILE_NO },
//     });

//     if (!existingUser) {
//       return res.status(400).json({
//         message: "This mobile number is not registered",
//         success: false,
//       });
//     }

//     // For development/testing - bypass OTP verification if using default "1234"
//     if (otp === "1234") {
//       const token = generateToken(existingUser);
//       return res.status(200).json({
//         message: "Login successful",
//         success: true,
//         token,
//         user: existingUser,
//       });
//     }

//     // In production, you would verify the OTP here
//     const otpRecord = await prisma.otp.findFirst({
//       where: { PR_MOBILE_NO },
//     });

//     if (!otpRecord || otpRecord.otp !== otp) {
//       return res.status(400).json({
//         message: "Invalid OTP",
//         success: false,
//       });
//     }

//     if (new Date() > otpRecord.expiresAt) {
//       return res.status(400).json({
//         message: "OTP has expired",
//         success: false,
//       });
//     }

//     const token = generateToken(existingUser);

//     return res.status(200).json({
//       message: "Login successful",
//       success: true,
//       token,
//       user: existingUser,
//     });
//   } catch (error) {
//     console.error("Error logging in:", error);
//     return res.status(500).json({
//       message: "Something went wrong",
//       success: false,
//       error: error.message,
//     });
//   }
// };

// const Joi = require("joi");
// const { prisma } = require("../prisma/prisma-client");
// const { generateToken } = require("../utils/generateToken");

// Helper function to check OTP verification
// const checkMobileVerified = async (mobile, otp) => {
//   // For development, bypass OTP verification with default "1234"
//   if (otp === "1234") {
//     return true;
//   }

//   const otpRecord = await prisma.otp.findFirst({
//     where: { PR_MOBILE_NO: mobile },
//   });

//   if (!otpRecord || otpRecord.otp !== otp) {
//     return false;
//   }

//   if (new Date() > otpRecord.expiresAt) {
//     return false;
//   }

//   return true;
// };

export const LoginUser = async (req, res) => {
  try {
    const { PR_MOBILE_NO, otp = "1234", selectedUserId } = req.body;

    // Validate mobile number format
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

    // Check if any users exist with this mobile number
    const existingUsers = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO },
      orderBy: { PR_ID: "desc" },
    });

    if (!existingUsers || existingUsers.length === 0) {
      return res.status(400).json({
        message: "This mobile number is not registered",
        success: false,
      });
    }

    // Step 1: If no OTP provided, generate/send OTP (or use default in dev)
    if (!req.body.otp) {
      // In production, you would generate and send a real OTP here
      // For now, we'll use the default "1234"

      // If multiple users exist, return them for selection
      if (existingUsers.length > 1) {
        return res.status(200).json({
          message: "Multiple accounts found",
          success: true,
          multipleUsers: true,
          users: existingUsers.map((user) => ({
            PR_ID: user.PR_ID,
            PR_FULL_NAME: user.PR_FULL_NAME,
            PR_UNIQUE_ID: user.PR_UNIQUE_ID,
            PR_PROFESSION: user.PR_PROFESSION,
            // Add other relevant user details
          })),
          debugOtp: "1234", // Remove in production
        });
      }

      // For single user, proceed with OTP
      return res.status(200).json({
        message: "OTP sent successfully",
        success: true,
        otpRequired: true,
        debugOtp: "1234", // Remove in production
      });
    }

    // Step 2: Verify OTP (skip if using default in development)
    const isVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
    if (!isVerified) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        success: false,
      });
    }

    // Step 3: Handle user selection if multiple accounts exist
    let user;
    if (existingUsers.length === 1) {
      user = existingUsers[0];
    } else {
      if (!selectedUserId) {
        return res.status(400).json({
          message: "User selection required",
          success: false,
        });
      }
      user = existingUsers.find((u) => u.PR_ID === selectedUserId);
      if (!user) {
        return res.status(400).json({
          message: "Invalid user selection",
          success: false,
        });
      }
    }

    // Step 4: Generate token for the selected user
    const token = generateToken(user);

    // Include family and member information in response
    const responseUser = {
      PR_ID: user.PR_ID,
      PR_FULL_NAME: user.PR_FULL_NAME,
      PR_UNIQUE_ID: user.PR_UNIQUE_ID,
      PR_MOBILE_NO: user.PR_MOBILE_NO,
      PR_GENDER: user.PR_GENDER,
      PR_PROFESSION: user.PR_PROFESSION,
      PR_ADDRESS: user.PR_ADDRESS,
      PR_FAMILY_NO: user.PR_FAMILY_NO,
      PR_MEMBER_NO: user.PR_MEMBER_NO,
      PR_PHOTO_URL: user.PR_PHOTO_URL,
      // Add other relevant fields
    };

    return res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      user: responseUser,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
};
