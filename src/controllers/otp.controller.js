import { PrismaClient } from "@prisma/client/extension";
import otpGenerator from "otp-generator";
import prisma from "../db/prismaClient.js";
// import { z } from "zod";
import Joi from "joi";
import { log } from "console";
import twilio from "twilio";
import dotenv from "dotenv";
import axios from "axios";

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
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });

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
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${PR_MOBILE_NO}/${otp}/${OTP_TEMPLATE_NAME}`;
    const response = await axios.get(url);

    console.log(`OTP ${otp} sent to ${PR_MOBILE_NO}:`, response.data);

    return res
      .status(200)
      .json({ message: "OTP sent successfully", success: true });
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
    let familyNumber = "001";
    let memberNumber = "001";

    if (allUsersSameMobile.length > 0) {
      // If users exist with same mobile number, use same family number and increment member number
      const lastUser = allUsersSameMobile[0];
      const lastUniqueIdParts = lastUser.PR_UNIQUE_ID?.split("-") || [];

      if (lastUniqueIdParts.length === 4) {
        familyNumber = lastUniqueIdParts[2];
        const lastMemberNumber = parseInt(lastUniqueIdParts[3]);
        memberNumber = (lastMemberNumber + 1).toString().padStart(3, "0");
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
          familyNumber = (lastFamilyNumber + 1).toString().padStart(3, "0");
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

//     // Verify OTP
//     const isOtpValid = await verifyFunc(PR_MOBILE_NO, otp);
//     if (!isOtpValid) {
//       return res.status(400).json({
//         message: "OTP is expired or invalid",
//         success: false,
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

//     // Check if the new mobile number is already registered to another user
//     if (existingUser.PR_MOBILE_NO !== PR_MOBILE_NO) {
//       const userWithSameMobile = await prisma.peopleRegistry.findFirst({
//         where: {
//           PR_MOBILE_NO: PR_MOBILE_NO,
//           NOT: { PR_ID: Number(PR_ID) },
//         },
//       });

//       if (userWithSameMobile) {
//         return res.status(400).json({
//           message: "This mobile number is already registered to another user",
//           success: false,
//         });
//       }
//     }

//     // Format the date as string (YYYY-MM-DD)
//     const formattedDOB = new Date(PR_DOB).toISOString().split("T")[0];

//     // Update user information
//     const updatedUser = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: {
//         PR_MOBILE_NO,
//         PR_FULL_NAME,
//         PR_DOB: formattedDOB,
//       },
//     });

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       success: true,
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Error in profile update:", error);

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

//     // Verify OTP
//     const isOtpValid = await verifyFunc(PR_MOBILE_NO, otp);
//     if (!isOtpValid) {
//       return res.status(400).json({
//         message: "OTP is expired or invalid",
//         success: false,
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

//     // Update user information - no longer checking for mobile number conflicts
//     const updatedUser = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: {
//         PR_MOBILE_NO,
//         PR_FULL_NAME,
//         PR_DOB: formattedDOB,
//       },
//     });

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       success: true,
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Error in profile update:", error);

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

export const updateProfile = async (req, res) => {
  try {
    const { PR_ID, PR_MOBILE_NO, PR_FULL_NAME, PR_DOB, otp } = req.body;

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

    // Prepare update data
    const updateData = {
      PR_FULL_NAME,
      PR_DOB: formattedDOB,
    };

    // Check if mobile number is being changed
    if (existingUser.PR_MOBILE_NO !== PR_MOBILE_NO) {
      // Get all family members with old mobile number
      const oldFamilyMembers = await prisma.peopleRegistry.findMany({
        where: { PR_MOBILE_NO: existingUser.PR_MOBILE_NO },
        orderBy: { PR_ID: "asc" },
      });

      // Get all family members with new mobile number
      const newFamilyMembers = await prisma.peopleRegistry.findMany({
        where: { PR_MOBILE_NO: PR_MOBILE_NO },
        orderBy: { PR_ID: "asc" },
      });

      // If moving to a new family (new mobile number)
      if (newFamilyMembers.length === 0) {
        // Find the last family in the same location
        const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
          where: {
            PR_STATE_CODE: existingUser.PR_STATE_CODE,
            PR_DISTRICT_CODE: existingUser.PR_DISTRICT_CODE,
            PR_CITY_CODE: existingUser.PR_CITY_CODE,
            NOT: { PR_MOBILE_NO: PR_MOBILE_NO },
          },
          orderBy: { PR_UNIQUE_ID: "desc" },
        });

        let familyNumber = "001";
        if (lastFamilyInLocation) {
          const parts = lastFamilyInLocation.PR_UNIQUE_ID?.split("-");
          if (parts?.length === 4) {
            const lastFamilyNum = parseInt(parts[2]);
            familyNumber = (lastFamilyNum + 1).toString().padStart(3, "0");
          }
        }

        // Update the user's mobile number and unique ID
        updateData.PR_MOBILE_NO = PR_MOBILE_NO;
        updateData.PR_UNIQUE_ID = `${existingUser.PR_STATE_CODE}${existingUser.PR_DISTRICT_CODE}-${existingUser.PR_CITY_CODE}-${familyNumber}-001`;
        updateData.PR_FAMILY_NO = familyNumber;
        updateData.PR_MEMBER_NO = "001";
      } else {
        // If joining an existing family (mobile number already exists)
        const memberNumber = (newFamilyMembers.length + 1)
          .toString()
          .padStart(3, "0");
        const familyNumber = newFamilyMembers[0].PR_FAMILY_NO || "001";

        updateData.PR_MOBILE_NO = PR_MOBILE_NO;
        updateData.PR_UNIQUE_ID = `${newFamilyMembers[0].PR_STATE_CODE}${newFamilyMembers[0].PR_DISTRICT_CODE}-${newFamilyMembers[0].PR_CITY_CODE}-${familyNumber}-${memberNumber}`;
        updateData.PR_FAMILY_NO = familyNumber;
        updateData.PR_MEMBER_NO = memberNumber;
      }

      // If this was part of a family, update remaining members' member numbers
      if (oldFamilyMembers.length > 1) {
        await prisma.$transaction(async (tx) => {
          for (let i = 0; i < oldFamilyMembers.length; i++) {
            const member = oldFamilyMembers[i];
            if (member.PR_ID !== existingUser.PR_ID) {
              const memberNumber = (i + 1).toString().padStart(3, "0");
              await tx.peopleRegistry.update({
                where: { PR_ID: member.PR_ID },
                data: {
                  PR_MEMBER_NO: memberNumber,
                  PR_UNIQUE_ID: `${member.PR_STATE_CODE}${member.PR_DISTRICT_CODE}-${member.PR_CITY_CODE}-${member.PR_FAMILY_NO}-${memberNumber}`,
                },
              });
            }
          }
        });
      }
    } else {
      // Mobile number not changing, just update other fields
      updateData.PR_MOBILE_NO = PR_MOBILE_NO;
    }

    // Update user information
    const updatedUser = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: updateData,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in profile update:", error);

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
