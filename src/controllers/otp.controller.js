import { PrismaClient } from "@prisma/client/extension";
import otpGenerator from "otp-generator";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import { log } from "console";
import twilio from "twilio";
import dotenv from "dotenv";
import axios from "axios";
// import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";

dotenv.config();

const twillo_Phone_Number = +16203019559;

const twilioClient = twilio(
  process.env.Twillo_Account_SID,
  process.env.Twillo_Auth_Token
);
const API_KEY = "94587c48-8d46-11ea-9fa5-0200cd936042";
const OTP_TEMPLATE_NAME = "OTP1";

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

    // Generate 4-digit OTP
    // const otp = otpGenerator.generate(4, {
    //   upperCaseAlphabets: false,
    //   specialChars: false,
    //   lowerCaseAlphabets: false,
    //   digits: true,
    // });
    const otp = "1234"; // For testing purposes, use a fixed OTP
    // Save OTP in DB
    await prisma.otp.upsert({
      where: { PR_MOBILE_NO },
      update: { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
      create: {
        PR_MOBILE_NO,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Send OTP using 2Factor API
    // const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${PR_MOBILE_NO}/${otp}/${OTP_TEMPLATE_NAME}`;
    // const response = await axios.get(url);
    const response = {
      data: {
        Status: "Success",
        Details: "5e75949c-6e8e-4b85-8f69-787e88556b42",
      },
    };
    console.log(`OTP ${otp} sent to ${PR_MOBILE_NO}:`, response.data);

    if (response.data.Status !== "Success") {
      return res.status(400).json({
        message: "OTP Failed",
        success: false,
        details: response.data.Details, // optionally include details
      });
    } else {
      // {"Status":"Success","Details":"5e75949c-6e8e-4b85-8f69-787e88556b42"}

      return res.status(200).json({
        message: "OTP sent successfully",
        success: true,
        transactionId: response.data.Details,
      });
    }
  } catch (error) {
    console.error("Error generating OTP:", error.message);
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

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
      PR_PIN_CODE,
      PR_AREA_NAME,
      PR_ADDRESS,
      PR_FATHER_NAME,
      PR_MOTHER_NAME,
      // PR_FCM_TOKEN,
    } = req.body;

    // Validate input data
    const schema = Joi.object({
      PR_MOBILE_NO: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({ "string.pattern.base": "Invalid mobile number" }),
      otp: Joi.string().length(4).required(),
      PR_FULL_NAME: Joi.string().min(1).max(100).required(),
      PR_DOB: Joi.date().required(),
      PR_STATE_CODE: Joi.string().allow("").optional(),
      PR_DISTRICT_CODE: Joi.string().allow("").optional(),
      PR_CITY_NAME: Joi.string().allow("").optional(),
      PR_PIN_CODE: Joi.string().allow("").optional(),
      PR_AREA_NAME: Joi.string().allow("").optional(),
      PR_ADDRESS: Joi.string().allow("").optional(),
      PR_FATHER_NAME: Joi.string().allow("").optional(),
      PR_MOTHER_NAME: Joi.string().allow("").optional(),
      // PR_FCM_TOKEN: PR_FCM_TOKEN || null,
    });

    const { error } = schema.validate({
      PR_MOBILE_NO,
      otp,
      PR_FULL_NAME,
      PR_DOB,
      PR_STATE_CODE,
      PR_DISTRICT_CODE,
      PR_CITY_NAME,
      PR_PIN_CODE,
      PR_AREA_NAME,
      PR_ADDRESS,
      PR_FATHER_NAME,
      PR_MOTHER_NAME,
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

    // Check if user already exists with this mobile number AND name
    const existingUsers = await prisma.peopleRegistry.findMany({
      where: {
        PR_MOBILE_NO: PR_MOBILE_NO,
        PR_FULL_NAME: PR_FULL_NAME,
      },
      orderBy: { PR_ID: "desc" },
    });

    // Determine if profile is completed
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

    // If user exists with same mobile AND name and is complete, return it
    if (existingUsers.length > 0 && existingUsers[0].PR_IS_COMPLETED === "Y") {
      return res.status(200).json({
        message: "User with this mobile number and name already exists",
        success: true,
        user: existingUsers[0],
        PR_ID: existingUsers[0].PR_ID,
        isExistingUser: true,
        isProfileComplete: true,
      });
    }

    // Handle city information
    let cityId = null;
    if (PR_CITY_NAME && PR_DISTRICT_CODE && PR_STATE_CODE) {
      // Find or create city to get CITY_ID
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
            CITY_NAME: PR_CITY_NAME,
            CITY_DS_CODE: PR_DISTRICT_CODE,
            CITY_ST_CODE: PR_STATE_CODE,
            CITY_PIN_CODE: PR_PIN_CODE || "",
            CITY_DS_NAME: "",
            CITY_ST_NAME: "",
          },
        });
      }
      cityId = city?.CITY_ID || null;
    }

    // Format the date as string (YYYY-MM-DD)
    const formattedDOB = new Date(PR_DOB).toISOString().split("T")[0];

    // Get all users with same mobile number (regardless of name) for family number calculation
    const allUsersSameMobile = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO: PR_MOBILE_NO },
      orderBy: { PR_ID: "desc" },
    });

    // Generate family and member numbers
    let familyNumber = "0001";
    let memberNumber = "0001";

    if (allUsersSameMobile.length > 0) {
      // If users exist with same mobile number, use same family number and increment member number
      const lastUser = allUsersSameMobile[0];
      const lastUniqueIdParts = lastUser.PR_UNIQUE_ID?.split("-") || [];

      if (lastUniqueIdParts.length === 4) {
        familyNumber = lastUniqueIdParts[2];
        //   const lastMemberNumber = parseInt(lastUniqueIdParts[3]);
        //   memberNumber = (lastMemberNumber + 1).toString().padStart(4, "0");
        // }
        const familyMembers = allUsersSameMobile.filter((user) => {
          const parts = user.PR_UNIQUE_ID?.split("-") || [];
          return parts.length === 4 && parts[2] === familyNumber;
        });

        if (familyMembers.length > 0) {
          const lastMember = familyMembers[0];
          const lastMemberParts = lastMember.PR_UNIQUE_ID?.split("-") || [];
          if (lastMemberParts.length === 4) {
            const lastMemberNumber = parseInt(lastMemberParts[3]);
            memberNumber = (lastMemberNumber + 1).toString().padStart(4, "0");
          }
        }
      }
    } else {
      // For new family (new mobile number), find the next available family number
      const lastFamily = await prisma.peopleRegistry.findFirst({
        where: {
          PR_STATE_CODE: PR_STATE_CODE || "",
          PR_DISTRICT_CODE: PR_DISTRICT_CODE || "",
          PR_CITY_CODE: cityId || null,
        },
        orderBy: { PR_ID: "desc" },
      });

      if (lastFamily) {
        const lastUniqueIdParts = lastFamily.PR_UNIQUE_ID?.split("-") || [];
        if (lastUniqueIdParts.length === 4) {
          const lastFamilyNumber = parseInt(lastUniqueIdParts[2]);
          familyNumber = (lastFamilyNumber + 1).toString().padStart(4, "0");
        }
      }
    }

    // Generate unique ID - handle cases where city/state/district info is missing
    let uniqueId;
    if (PR_STATE_CODE && PR_DISTRICT_CODE && cityId) {
      uniqueId = `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${cityId}-${familyNumber}-${memberNumber}`;
    } else {
      // Default format when location info is missing
      uniqueId = `0000-00-${familyNumber}-${memberNumber}`;
    }

    // Create user data with dynamic completion status
    const userData = {
      PR_UNIQUE_ID: uniqueId,
      PR_FAMILY_NO: familyNumber,
      PR_MEMBER_NO: memberNumber,
      PR_MOBILE_NO,
      PR_FULL_NAME,
      PR_DOB: formattedDOB,
      PR_IS_COMPLETED: isCompleted,
      PR_ADDRESS: PR_ADDRESS || "",
      PR_AREA_NAME: PR_AREA_NAME || "",
      PR_PIN_CODE: PR_PIN_CODE || "",
      PR_STATE_CODE: PR_STATE_CODE || "",
      PR_DISTRICT_CODE: PR_DISTRICT_CODE || "",
      PR_CITY_CODE: cityId,
      PR_FATHER_NAME: PR_FATHER_NAME || "",
      PR_MOTHER_NAME: PR_MOTHER_NAME || "",
    };

    // Create or update user
    let user;
    if (existingUsers.length > 0 && existingUsers[0].PR_IS_COMPLETED === "N") {
      // Update existing incomplete profile with same name
      user = await prisma.peopleRegistry.update({
        where: { PR_ID: existingUsers[0].PR_ID },
        data: userData,
      });
    } else {
      // Create new profile (either new mobile or same mobile with different name)
      user = await prisma.peopleRegistry.create({
        data: userData,
      });
    }

    return res.status(200).json({
      message: "OTP verified successfully",
      success: true,
      user,
      PR_ID: user.PR_ID,
      isExistingUser: existingUsers.length > 0,
      isProfileComplete: isCompleted === "Y",
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

    if (otp !== otpRecord.otp) {
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

export const updateProfile = async (req, res) => {
  try {
    const {
      PR_ID,
      PR_MOBILE_NO,
      PR_FULL_NAME,
      PR_DOB,
      otp,
      //  PR_FCM_TOKEN
    } = req.body;

    // Validate input data
    const schema = Joi.object({
      PR_ID: Joi.number().required(),
      PR_MOBILE_NO: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({ "string.pattern.base": "Invalid mobile number" }),
      PR_FULL_NAME: Joi.string().min(3).max(100).required(),
      PR_DOB: Joi.date().required(),
      otp: Joi.string().required(),
    });

    const { error } = schema.validate({
      PR_ID,
      PR_MOBILE_NO,
      PR_FULL_NAME,
      PR_DOB,
      otp,
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

    // Check if user exists
    const existingUser = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: Number(PR_ID) },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Format the date as string (YYYY-MM-DD)
    const formattedDOB = new Date(PR_DOB).toISOString().split("T")[0];

    // Prepare update data - only update name, dob, and mobile
    const updateData = {
      PR_FULL_NAME,
      PR_DOB: formattedDOB,
      PR_MOBILE_NO,
      // ...(PR_FCM_TOKEN && { PR_FCM_TOKEN }),
    };

    let transferredFromUser = null;

    // Check if mobile number is being changed to a new number
    if (existingUser.PR_MOBILE_NO !== PR_MOBILE_NO) {
      // Find user with the new mobile number
      const userWithNewMobile = await prisma.peopleRegistry.findFirst({
        where: {
          PR_MOBILE_NO: PR_MOBILE_NO,
          NOT: { PR_ID: Number(PR_ID) },
        },
      });

      if (userWithNewMobile) {
        // Store info about the user who already has this mobile number
        transferredFromUser = {
          userId: userWithNewMobile.PR_ID,
          userName: userWithNewMobile.PR_FULL_NAME,
        };

        // Don't clear the mobile number from the other user
        // Both users will have the same mobile number
        console.log(
          `Mobile number ${PR_MOBILE_NO} will be shared between user ${userWithNewMobile.PR_ID} and ${PR_ID}`
        );
      }
    }

    // Update user information
    const updatedUser = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: updateData,
    });

    // Prepare response message
    let responseMessage = "Profile updated successfully";
    if (transferredFromUser) {
      responseMessage += ". Mobile number is now shared with another user.";
    }

    return res.status(200).json({
      message: responseMessage,
      success: true,
      user: updatedUser,
      mobileTransferred: transferredFromUser
        ? {
            message: `Mobile number is also registered to ${transferredFromUser.userName}`,
            sharedWithUserId: transferredFromUser.userId,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in profile update:", error);

    // Handle Prisma unique constraint error (backup in case the above logic fails)
    if (error.code === "P2002") {
      try {
        // Find the conflicting user and clear their mobile number
        const conflictingUser = await prisma.peopleRegistry.findFirst({
          where: {
            PR_MOBILE_NO: PR_MOBILE_NO,
            NOT: { PR_ID: Number(PR_ID) },
          },
        });

        if (conflictingUser) {
          // Don't clear the mobile number from conflicting user
          // Just log that there's a shared mobile number
          console.log(
            `Resolved P2002 error: Mobile number ${PR_MOBILE_NO} will be shared between users ${conflictingUser.PR_ID} and ${PR_ID}`
          );
        }

        // Retry the update
        const updatedUser = await prisma.peopleRegistry.update({
          where: { PR_ID: Number(PR_ID) },
          data: updateData,
        });

        return res.status(200).json({
          message: "Profile updated successfully (mobile number shared)",
          success: true,
          user: updatedUser,
          mobileTransferred: conflictingUser
            ? {
                message: `Mobile number is also registered to ${conflictingUser.PR_FULL_NAME}`,
                sharedWithUserId: conflictingUser.PR_ID,
              }
            : null,
        });
      } catch (retryError) {
        console.error("Failed to resolve mobile number conflict:", retryError);
        return res.status(500).json({
          message: "Failed to resolve mobile number conflict",
          success: false,
        });
      }
    }

    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// export const generateotp = async (req, res) => {
//   try {
//     const { PR_MOBILE_NO } = req.body;

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

//     // Generate 4-digit OTP
//     const otp = otpGenerator.generate(4, {
//       upperCaseAlphabets: false,
//       specialChars: false,
//       lowerCaseAlphabets: false,
//       digits: true,
//     });

//     // Save OTP in DB
//     await prisma.otp.upsert({
//       where: { PR_MOBILE_NO },
//       update: { otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
//       create: {
//         PR_MOBILE_NO,
//         otp,
//         expiresAt: new Date(Date.now() + 5 * 60 * 1000),
//       },
//     });

//     // Send OTP using 2Factor API
//     const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${PR_MOBILE_NO}/${otp}/${OTP_TEMPLATE_NAME}`;
//     const response = await axios.get(url);

//     console.log(`OTP ${otp} sent to ${PR_MOBILE_NO}:`, response.data);

//     if (response.data.Status !== "Success") {
//       return res.status(400).json({
//         message: "OTP Failed",
//         success: false,
//         details: response.data.Details,
//       });
//     } else {
//       return res.status(200).json({
//         message: "OTP sent successfully",
//         success: true,
//         transactionId: response.data.Details,
//       });
//     }
//   } catch (error) {
//     console.error("Error generating OTP:", error.message);
//     return res
//       .status(500)
//       .json({ message: "Something went wrong", success: false });
//   }
// };

// export const verifyotp = async (req, res) => {
//   try {
//     const {
//       PR_MOBILE_NO,
//       otp,
//       PR_FULL_NAME,
//       PR_DOB,
//       PR_STATE_CODE,
//       PR_DISTRICT_CODE,
//       PR_CITY_NAME,
//       PR_PIN_CODE,
//       PR_AREA_NAME,
//       PR_ADDRESS,
//       PR_FATHER_NAME,
//       PR_MOTHER_NAME,
//     } = req.body;

//     // Validate input data
//     const schema = Joi.object({
//       PR_MOBILE_NO: Joi.string()
//         .pattern(/^[6-9]\d{9}$/)
//         .required()
//         .messages({ "string.pattern.base": "Invalid mobile number" }),
//       otp: Joi.string().length(4).required(),
//       PR_FULL_NAME: Joi.string().min(1).max(100).required(),
//       PR_DOB: Joi.date().required(),
//       PR_STATE_CODE: Joi.string().allow("").optional(),
//       PR_DISTRICT_CODE: Joi.string().allow("").optional(),
//       PR_CITY_NAME: Joi.string().allow("").optional(),
//       PR_PIN_CODE: Joi.string().allow("").optional(),
//       PR_AREA_NAME: Joi.string().allow("").optional(),
//       PR_ADDRESS: Joi.string().allow("").optional(),
//       PR_FATHER_NAME: Joi.string().allow("").optional(),
//       PR_MOTHER_NAME: Joi.string().allow("").optional(),
//     });

//     const { error } = schema.validate({
//       PR_MOBILE_NO,
//       otp,
//       PR_FULL_NAME,
//       PR_DOB,
//       PR_STATE_CODE,
//       PR_DISTRICT_CODE,
//       PR_CITY_NAME,
//       PR_PIN_CODE,
//       PR_AREA_NAME,
//       PR_ADDRESS,
//       PR_FATHER_NAME,
//       PR_MOTHER_NAME,
//     });

//     if (error) {
//       return res.status(400).json({
//         message: error.details[0].message,
//         success: false,
//       });
//     }

//     // Verify OTP using 2Factor API
//     const verificationUrl = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY3/${PR_MOBILE_NO}/${otp}`;
//     const verificationResponse = await axios.get(verificationUrl);

//     if (verificationResponse.data.Status !== "Success") {
//       return res.status(400).json({
//         message: "OTP is expired or invalid",
//         success: false,
//         details: verificationResponse.data.Details,
//       });
//     }

//     // Check if user already exists with this mobile number AND name
//     const existingUsers = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_MOBILE_NO: PR_MOBILE_NO,
//         PR_FULL_NAME: PR_FULL_NAME,
//       },
//       orderBy: { PR_ID: "desc" },
//     });

//     // Determine if profile is completed
//     const isCompleted =
//       req?.body?.PR_FULL_NAME &&
//       req?.body?.PR_DOB &&
//       req?.body?.PR_MOBILE_NO &&
//       req?.body?.PR_PIN_CODE &&
//       req?.body?.PR_AREA_NAME &&
//       req?.body?.PR_ADDRESS &&
//       req?.body?.PR_FATHER_NAME &&
//       req?.body?.PR_MOTHER_NAME
//         ? "Y"
//         : "N";

//     // If user exists with same mobile AND name and is complete, return it
//     if (existingUsers.length > 0 && existingUsers[0].PR_IS_COMPLETED === "Y") {
//       return res.status(200).json({
//         message: "User with this mobile number and name already exists",
//         success: true,
//         user: existingUsers[0],
//         PR_ID: existingUsers[0].PR_ID,
//         isExistingUser: true,
//         isProfileComplete: true,
//       });
//     }

//     // Handle city information
//     let cityId = null;
//     if (PR_CITY_NAME && PR_DISTRICT_CODE && PR_STATE_CODE) {
//       // Find or create city to get CITY_ID
//       let city = await prisma.city.findFirst({
//         where: {
//           CITY_NAME: PR_CITY_NAME,
//           CITY_DS_CODE: PR_DISTRICT_CODE,
//           CITY_ST_CODE: PR_STATE_CODE,
//         },
//       });

//       if (!city) {
//         city = await prisma.city.create({
//           data: {
//             CITY_NAME: PR_CITY_NAME,
//             CITY_DS_CODE: PR_DISTRICT_CODE,
//             CITY_ST_CODE: PR_STATE_CODE,
//             CITY_PIN_CODE: PR_PIN_CODE || "",
//             CITY_DS_NAME: "",
//             CITY_ST_NAME: "",
//           },
//         });
//       }
//       cityId = city?.CITY_ID || null;
//     }

//     // Format the date as string (YYYY-MM-DD)
//     const formattedDOB = new Date(PR_DOB).toISOString().split("T")[0];

//     // Get all users with same mobile number (regardless of name) for family number calculation
//     const allUsersSameMobile = await prisma.peopleRegistry.findMany({
//       where: { PR_MOBILE_NO: PR_MOBILE_NO },
//       orderBy: { PR_ID: "desc" },
//     });

//     // Generate family and member numbers
//     let familyNumber = "0001";
//     let memberNumber = "0001";

//     if (allUsersSameMobile.length > 0) {
//       // If users exist with same mobile number, use same family number and increment member number
//       const lastUser = allUsersSameMobile[0];
//       const lastUniqueIdParts = lastUser.PR_UNIQUE_ID?.split("-") || [];

//       if (lastUniqueIdParts.length === 4) {
//         familyNumber = lastUniqueIdParts[2];
//         const familyMembers = allUsersSameMobile.filter((user) => {
//           const parts = user.PR_UNIQUE_ID?.split("-") || [];
//           return parts.length === 4 && parts[2] === familyNumber;
//         });

//         if (familyMembers.length > 0) {
//           const lastMember = familyMembers[0];
//           const lastMemberParts = lastMember.PR_UNIQUE_ID?.split("-") || [];
//           if (lastMemberParts.length === 4) {
//             const lastMemberNumber = parseInt(lastMemberParts[3]);
//             memberNumber = (lastMemberNumber + 1).toString().padStart(4, "0");
//           }
//         }
//       }
//     } else {
//       // For new family (new mobile number), find the next available family number
//       const lastFamily = await prisma.peopleRegistry.findFirst({
//         where: {
//           PR_STATE_CODE: PR_STATE_CODE || "",
//           PR_DISTRICT_CODE: PR_DISTRICT_CODE || "",
//           PR_CITY_CODE: cityId || null,
//         },
//         orderBy: { PR_ID: "desc" },
//       });

//       if (lastFamily) {
//         const lastUniqueIdParts = lastFamily.PR_UNIQUE_ID?.split("-") || [];
//         if (lastUniqueIdParts.length === 4) {
//           const lastFamilyNumber = parseInt(lastUniqueIdParts[2]);
//           familyNumber = (lastFamilyNumber + 1).toString().padStart(4, "0");
//         }
//       }
//     }

//     // Generate unique ID - handle cases where city/state/district info is missing
//     let uniqueId;
//     if (PR_STATE_CODE && PR_DISTRICT_CODE && cityId) {
//       uniqueId = `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${cityId}-${familyNumber}-${memberNumber}`;
//     } else {
//       // Default format when location info is missing
//       uniqueId = `0000-00-${familyNumber}-${memberNumber}`;
//     }

//     // Create user data with dynamic completion status
//     const userData = {
//       PR_UNIQUE_ID: uniqueId,
//       PR_FAMILY_NO: familyNumber,
//       PR_MEMBER_NO: memberNumber,
//       PR_MOBILE_NO,
//       PR_FULL_NAME,
//       PR_DOB: formattedDOB,
//       PR_IS_COMPLETED: isCompleted,
//       PR_ADDRESS: PR_ADDRESS || "",
//       PR_AREA_NAME: PR_AREA_NAME || "",
//       PR_PIN_CODE: PR_PIN_CODE || "",
//       PR_STATE_CODE: PR_STATE_CODE || "",
//       PR_DISTRICT_CODE: PR_DISTRICT_CODE || "",
//       PR_CITY_CODE: cityId,
//       PR_FATHER_NAME: PR_FATHER_NAME || "",
//       PR_MOTHER_NAME: PR_MOTHER_NAME || "",
//     };

//     // Create or update user
//     let user;
//     if (existingUsers.length > 0 && existingUsers[0].PR_IS_COMPLETED === "N") {
//       // Update existing incomplete profile with same name
//       user = await prisma.peopleRegistry.update({
//         where: { PR_ID: existingUsers[0].PR_ID },
//         data: userData,
//       });
//     } else {
//       // Create new profile (either new mobile or same mobile with different name)
//       user = await prisma.peopleRegistry.create({
//         data: userData,
//       });
//     }

//     return res.status(200).json({
//       message: "OTP verified successfully",
//       success: true,
//       user,
//       PR_ID: user.PR_ID,
//       isExistingUser: existingUsers.length > 0,
//       isProfileComplete: isCompleted === "Y",
//     });
//   } catch (error) {
//     console.error("Error in OTP verification:", error);

//     if (error.code === "P2002") {
//       return res.status(400).json({
//         message: "Mobile number already registered",
//         success: false,
//       });
//     }

//     return res.status(500).json({
//       message: error.message || "Internal server error",
//       success: false,
//     });
//   }
// };

// export const updateProfile = async (req, res) => {
//   try {
//     const { PR_ID, PR_MOBILE_NO, PR_FULL_NAME, PR_DOB, otp } = req.body;

//     // Validate input data
//     const schema = Joi.object({
//       PR_ID: Joi.number().required(),
//       PR_MOBILE_NO: Joi.string()
//         .pattern(/^[6-9]\d{9}$/)
//         .required()
//         .messages({ "string.pattern.base": "Invalid mobile number" }),
//       PR_FULL_NAME: Joi.string().min(3).max(100).required(),
//       PR_DOB: Joi.date().required(),
//       otp: Joi.string().required(),
//     });

//     const { error } = schema.validate({
//       PR_ID,
//       PR_MOBILE_NO,
//       PR_FULL_NAME,
//       PR_DOB,
//       otp,
//     });

//     if (error) {
//       return res.status(400).json({
//         message: error.details[0].message,
//         success: false,
//       });
//     }

//     // Verify OTP using 2Factor API
//     const verificationUrl = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY3/${PR_MOBILE_NO}/${otp}`;
//     const verificationResponse = await axios.get(verificationUrl);

//     if (verificationResponse.data.Status !== "Success") {
//       return res.status(400).json({
//         message: "OTP is expired or invalid",
//         success: false,
//         details: verificationResponse.data.Details,
//       });
//     }

//     // Check if user exists
//     const existingUser = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });

//     if (!existingUser) {
//       return res.status(404).json({
//         message: "User not found",
//         success: false,
//       });
//     }

//     // Format the date as string (YYYY-MM-DD)
//     const formattedDOB = new Date(PR_DOB).toISOString().split("T")[0];

//     // Prepare update data - only update name, dob, and mobile
//     const updateData = {
//       PR_FULL_NAME,
//       PR_DOB: formattedDOB,
//       PR_MOBILE_NO,
//     };

//     let transferredFromUser = null;

//     // Check if mobile number is being changed to a new number
//     if (existingUser.PR_MOBILE_NO !== PR_MOBILE_NO) {
//       // Find user with the new mobile number
//       const userWithNewMobile = await prisma.peopleRegistry.findFirst({
//         where: {
//           PR_MOBILE_NO: PR_MOBILE_NO,
//           NOT: { PR_ID: Number(PR_ID) },
//         },
//       });

//       if (userWithNewMobile) {
//         transferredFromUser = {
//           userId: userWithNewMobile.PR_ID,
//           userName: userWithNewMobile.PR_FULL_NAME,
//         };
//         console.log(
//           `Mobile number ${PR_MOBILE_NO} will be shared between user ${userWithNewMobile.PR_ID} and ${PR_ID}`
//         );
//       }
//     }

//     // Update user information
//     const updatedUser = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: updateData,
//     });

//     // Prepare response message
//     let responseMessage = "Profile updated successfully";
//     if (transferredFromUser) {
//       responseMessage += ". Mobile number is now shared with another user.";
//     }

//     return res.status(200).json({
//       message: responseMessage,
//       success: true,
//       user: updatedUser,
//       mobileTransferred: transferredFromUser
//         ? {
//             message: `Mobile number is also registered to ${transferredFromUser.userName}`,
//             sharedWithUserId: transferredFromUser.userId,
//           }
//         : null,
//     });
//   } catch (error) {
//     console.error("Error in profile update:", error);

//     if (error.code === "P2002") {
//       try {
//         const conflictingUser = await prisma.peopleRegistry.findFirst({
//           where: {
//             PR_MOBILE_NO: PR_MOBILE_NO,
//             NOT: { PR_ID: Number(PR_ID) },
//           },
//         });

//         if (conflictingUser) {
//           console.log(
//             `Resolved P2002 error: Mobile number ${PR_MOBILE_NO} will be shared between users ${conflictingUser.PR_ID} and ${PR_ID}`
//           );
//         }

//         const updatedUser = await prisma.peopleRegistry.update({
//           where: { PR_ID: Number(PR_ID) },
//           data: updateData,
//         });

//         return res.status(200).json({
//           message: "Profile updated successfully (mobile number shared)",
//           success: true,
//           user: updatedUser,
//           mobileTransferred: conflictingUser
//             ? {
//                 message: `Mobile number is also registered to ${conflictingUser.PR_FULL_NAME}`,
//                 sharedWithUserId: conflictingUser.PR_ID,
//               }
//             : null,
//         });
//       } catch (retryError) {
//         console.error("Failed to resolve mobile number conflict:", retryError);
//         return res.status(500).json({
//           message: "Failed to resolve mobile number conflict",
//           success: false,
//         });
//       }
//     }

//     return res.status(500).json({
//       message: error.message || "Internal server error",
//       success: false,
//     });
//   }
// };

// export async function verifyFunc(PR_MOBILE_NO, otp) {
//   try {
//     const verificationUrl = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY3/${PR_MOBILE_NO}/${otp}`;
//     const verificationResponse = await axios.get(verificationUrl);

//     return verificationResponse.data.Status === "Success";
//   } catch (error) {
//     console.log("Error in OTP verification:", error);
//     return false;
//   }
// }
