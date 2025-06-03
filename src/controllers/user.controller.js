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
import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";
import { parse } from "path";

dotenv.config();

const twillo_Phone_Number = +16203019559;

const twilioClient = twilio(
  process.env.Twillo_Account_SID,
  process.env.Twillo_Auth_Token
);

export const registerUser = async (req, res) => {
  try {
    const { PR_MOBILE_NO, otp, Children, ...profileData } = req.body;

    // Validation Schema
    const schema = Joi.object({
      PR_MOBILE_NO: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({ "string.pattern.base": "Invalid mobile number" }),
      PR_FULL_NAME: Joi.string().min(3).max(100).required(),
      PR_DOB: Joi.date().required(),
      PR_GENDER: Joi.string().valid("M", "F", "O").required(),
      PR_PIN_CODE: Joi.string().length(6).required(),
      PR_STATE_CODE: Joi.string().required(),
      PR_DISTRICT_CODE: Joi.string().required(),
      PR_CITY_NAME: Joi.string().required(),
      PR_BUSS_STREAM: Joi.string().optional(),
      PR_BUSS_TYPE: Joi.string().optional(),
      Children: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required(),
            dob: Joi.date().required(),
          })
        )
        .optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // OTP Verification
    if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
      return res.status(401).json({
        success: false,
        message: "Mobile verification failed",
      });
    }

    return await prisma.$transaction(async (tx) => {
      // City Handling
      const city = await tx.city.upsert({
        where: {
          CITY_NAME_DS_ST: {
            CITY_NAME: profileData.PR_CITY_NAME,
            CITY_DS_CODE: profileData.PR_DISTRICT_CODE,
            CITY_ST_CODE: profileData.PR_STATE_CODE,
          },
        },
        update: {},
        create: {
          CITY_NAME: profileData.PR_CITY_NAME,
          CITY_DS_CODE: profileData.PR_DISTRICT_CODE,
          CITY_ST_CODE: profileData.PR_STATE_CODE,
          CITY_PIN_CODE: profileData.PR_PIN_CODE,
          CITY_DS_NAME: "",
          CITY_ST_NAME: "",
        },
      });

      // Business Handling
      const business =
        profileData.PR_BUSS_STREAM && profileData.PR_BUSS_TYPE
          ? await tx.bUSSINESS.upsert({
              where: {
                BUSS_STREM_TYPE: {
                  BUSS_STREM: profileData.PR_BUSS_STREAM,
                  BUSS_TYPE: profileData.PR_BUSS_TYPE,
                },
              },
              update: {},
              create: {
                BUSS_STREM: profileData.PR_BUSS_STREAM,
                BUSS_TYPE: profileData.PR_BUSS_TYPE,
                CITY_CREATED_BY: 1,
              },
            })
          : null;

      // Family Number Generation
      const existingUsers = await tx.peopleRegistry.findMany({
        where: { PR_MOBILE_NO },
        orderBy: { PR_ID: "desc" },
      });

      const familyNumber =
        existingUsers.length > 0
          ? existingUsers[0].PR_FAMILY_NO
          : await getNextFamilyNumber(
              profileData.PR_STATE_CODE,
              profileData.PR_DISTRICT_CODE,
              city.CITY_ID
            );

      const memberNumber = (existingUsers.length + 1)
        .toString()
        .padStart(4, "0");

      // User Creation
      const newUser = await tx.peopleRegistry.create({
        data: {
          PR_UNIQUE_ID: `${profileData.PR_STATE_CODE}${profileData.PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${memberNumber}`,
          PR_FAMILY_NO: familyNumber,
          PR_MEMBER_NO: memberNumber,
          PR_MOBILE_NO,
          PR_DOB: new Date(profileData.PR_DOB).toISOString(),
          PR_CITY_CODE: city.CITY_ID,
          PR_BUSS_CODE: business?.BUSS_ID || null,
          ...profileData,
          PR_IS_COMPLETED: "Y", // Assuming full registration
        },
      });

      // Children Handling
      if (Children && Children.length > 0) {
        await tx.child.createMany({
          data: Children.map((child) => ({
            name: child.name,
            dob: new Date(child.dob).toISOString(),
            userId: newUser.PR_ID,
          })),
        });
      }

      // Final Response
      const completeUser = await tx.peopleRegistry.findUnique({
        where: { PR_ID: newUser.PR_ID },
        include: { Children: true, City: true, BUSSINESS: true },
      });

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: completeUser,
      });
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const checkMobileVerified = async (mobile, otp) => {
  const otpRecord = await prisma.otp.findFirst({
    where: { PR_MOBILE_NO: mobile, otp },
  });

  if (!otpRecord || otpRecord.otp !== otp) {
    return false;
  }

  if (new Date() > otpRecord.expiresAt) {
    return false;
  }

  return true;
};

export const LoginUser = async (req, res) => {
  try {
    const { PR_MOBILE_NO, otp, selectedUserId } = req.body;

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

    // Step 1: First check if OTP is provided
    if (!otp) {
      // Check if mobile number exists in database
      const userCount = await prisma.peopleRegistry.count({
        where: { PR_MOBILE_NO },
      });

      if (userCount === 0) {
        return res.status(400).json({
          message: "This mobile number is not registered",
          success: false,
        });
      }

      // Create a mock request object for generateotp
      const mockReq = {
        body: { PR_MOBILE_NO },
      };

      // Create a mock response object to capture generateotp's response
      let otpResponse;
      const mockRes = {
        json: (data) => {
          otpResponse = data;
          return data;
        },
        status: (code) => ({
          json: (data) => {
            otpResponse = { ...data, statusCode: code };
            return data;
          },
        }),
      };

      // Call generateotp with mock request/response
      await generateotp(mockReq, mockRes);

      if (!otpResponse?.success) {
        return res.status(otpResponse?.statusCode || 500).json({
          message: otpResponse?.message || "Failed to send OTP",
          success: false,
        });
      }

      return res.status(200).json({
        message: "OTP sent successfully",
        success: true,
        otpRequired: true,
      });
    }

    // Step 2: Verify OTP
    const isVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
    if (!isVerified) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        success: false,
      });
    }

    // Step 3: Now that OTP is verified, check for users
    const existingUsers = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO },
      orderBy: { PR_ID: "desc" },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!existingUsers || existingUsers.length === 0) {
      return res.status(400).json({
        message: "This mobile number is not registered",
        success: false,
      });
    }

    // Step 4: Handle user selection if multiple accounts exist
    let user;
    if (existingUsers.length === 1) {
      user = existingUsers[0];
    } else {
      if (!selectedUserId) {
        return res.status(200).json({
          message: "Multiple accounts found",
          success: true,
          multipleUsers: true,
          users: existingUsers.map((user) => ({
            PR_ID: user.PR_ID,
            PR_FULL_NAME: user.PR_FULL_NAME,
            PR_UNIQUE_ID: user.PR_UNIQUE_ID,
            PR_PROFESSION: user.Profession?.PROF_NAME,
            PR_PHOTO_URL: user.PR_PHOTO_URL,
          })),
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

    // Step 5: Generate token for the selected user
    const token = generateToken(user);

    // Prepare complete user data for response
    const responseUser = {
      PR_ID: user.PR_ID,
      PR_FULL_NAME: user.PR_FULL_NAME,
      PR_UNIQUE_ID: user.PR_UNIQUE_ID,
      PR_MOBILE_NO: user.PR_MOBILE_NO,
      PR_GENDER: user.PR_GENDER,
      PR_ADDRESS: user.PR_ADDRESS,
      PR_PHOTO_URL: user.PR_PHOTO_URL,
      PR_DOB: user.PR_DOB,
      PR_PIN_CODE: user.PR_PIN_CODE,
      PR_STATE_CODE: user.PR_STATE_CODE,
      PR_DISTRICT_CODE: user.PR_DISTRICT_CODE,
      PR_AREA_NAME: user.PR_AREA_NAME,
      PR_EDUCATION: user.PR_EDUCATION,
      PR_EDUCATION_DESC: user.PR_EDUCATION_DESC,
      PR_PROFESSION_DETA: user.PR_PROFESSION_DETA,
      PR_FATHER_NAME: user.PR_FATHER_NAME,
      PR_MOTHER_NAME: user.PR_MOTHER_NAME,
      PR_SPOUSE_NAME: user.PR_SPOUSE_NAME,
      PR_MARRIED_YN: user.PR_MARRIED_YN,
      PR_BUSS_INTER: user.PR_BUSS_INTER || "N",
      PR_BUSS_STREAM: user.PR_BUSS_STREAM || "",
      PR_BUSS_TYPE: user.PR_BUSS_TYPE || "",
      PR_HOBBY: user.PR_HOBBY || [],
      Profession: {
        PROF_ID: user.Profession?.PROF_ID,
        PROF_NAME: user.Profession?.PROF_NAME,
      },
      City: {
        CITY_ST_NAME: user.City?.CITY_ST_NAME,
        CITY_DS_NAME: user.City?.CITY_DS_NAME,
      },
      Children: user.Children || [],
    };

    // Step 6: Delete the used OTP record
    await prisma.otp.deleteMany({
      where: { PR_MOBILE_NO },
    });

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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const checkPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // type: 'father', 'mother', 'spouse'

    // Make sure id is a non-empty string
    if (!id || typeof id !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid PR_UNIQUE_ID format" });
    }

    const person = await prisma.peopleRegistry.findFirst({
      where: { PR_UNIQUE_ID: id },
      select: { PR_UNIQUE_ID: true, PR_GENDER: true, PR_FULL_NAME: true },
    });

    if (!person) {
      return res
        .status(404)
        .json({ success: false, message: "PR_UNIQUE_ID not present" });
    }

    // Gender validation based on type
    if (type === "father" && person.PR_GENDER !== "M") {
      return res.status(400).json({
        success: false,
        message: "Invalid gender for father. Expected Male.",
      });
    }

    if (type === "mother" && person.PR_GENDER !== "F") {
      return res.status(400).json({
        success: false,
        message: "Invalid gender for mother. Expected Female.",
      });
    }

    // For spouse, just check existence — no gender restriction needed

    return res.status(200).json({
      success: true,
      data: person,
      message: `PR_UNIQUE_ID is valid${type ? " for " + type : ""}`,
    });
  } catch (error) {
    console.error("Check Person Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// export const convertUniqueIdToId = async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     // Validate input
//     if (!uniqueId || typeof uniqueId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_UNIQUE_ID format",
//       });
//     }

//     // Query the database for the corresponding PR_ID using findFirst
//     const person = await prisma.peopleRegistry.findFirst({
//       where: { PR_UNIQUE_ID: uniqueId },
//       select: { PR_ID: true, PR_UNIQUE_ID: true },
//     });

//     if (!person) {
//       return res.status(404).json({
//         success: false,
//         message: "PR_UNIQUE_ID not found in the database",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: person,
//       message: "PR_UNIQUE_ID successfully converted to PR_ID",
//     });
//   } catch (error) {
//     console.error("Convert Unique ID Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

export const convertUniqueIdToId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    if (!uniqueId?.trim()) {
      // More thorough validation
      return res.status(400).json({
        success: false,
        message: "PR_UNIQUE_ID is required",
      });
    }

    const person = await prisma.peopleRegistry.findFirst({
      where: {
        PR_UNIQUE_ID: uniqueId.trim(),
      },
      select: {
        PR_ID: true,
        PR_UNIQUE_ID: true,
      },
    });

    if (!person) {
      return res.status(404).json({
        success: false,
        message: "Person not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: person,
    });
  } catch (error) {
    console.error("Error in convertUniqueIdToId:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    if (!uniqueId || typeof uniqueId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid PR_UNIQUE_ID format",
      });
    }

    const user = await prisma.peopleRegistry.findFirst({
      where: { PR_UNIQUE_ID: uniqueId },
      select: {
        PR_UNIQUE_ID: true,
        PR_FULL_NAME: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this PR_UNIQUE_ID not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user by PR_UNIQUE_ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 1. Get all families with same district and city code (with type conversion)
export const getFamiliesByLocation = async (req, res) => {
  try {
    const districtCode = req.params.districtCode;
    const cityCode = parseInt(req.params.cityCode, 10);

    if (!districtCode || isNaN(cityCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid district or city code format",
      });
    }

    const families = await prisma.peopleRegistry.findMany({
      where: {
        PR_DISTRICT_CODE: districtCode,
        PR_CITY_CODE: cityCode,
      },
      include: {
        Children: true,
        Profession: true,
        City: true,
        BUSSINESS: true,
        Contact: true,
        Father: true,
        Mother: true,
        Spouse: true,
      },
      orderBy: {
        PR_FAMILY_NO: "asc",
      },
    });

    if (!families || families.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No families found in this location",
      });
    }

    return res.status(200).json({
      success: true,
      count: families.length,
      data: families,
    });
  } catch (error) {
    console.error("Error fetching families by location:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// 2. Get family members (with type conversion)
export const getFamilyMembers = async (req, res) => {
  try {
    const districtCode = req.params.districtCode; // string
    const cityCode = parseInt(req.params.cityCode, 10); // int
    const familyNo = req.params.familyNo; // string

    if (!districtCode || isNaN(cityCode) || !familyNo) {
      return res.status(400).json({
        success: false,
        message: "Invalid district, city, or family code format",
      });
    }

    const familyMembers = await prisma.peopleRegistry.findMany({
      where: {
        PR_DISTRICT_CODE: districtCode,
        PR_CITY_CODE: cityCode,
        PR_FAMILY_NO: familyNo,
      },
      include: {
        Children: true,
        Profession: true,
        City: true,
        BUSSINESS: true,
        Contact: true,
        Father: true,
        Mother: true,
        Spouse: true,
      },
      orderBy: {
        PR_ID: "asc",
      },
    });

    if (!familyMembers || familyMembers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No family members found with these details",
      });
    }

    return res.status(200).json({
      success: true,
      count: familyMembers.length,
      data: familyMembers,
    });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
