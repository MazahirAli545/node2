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
// import { generateotp } from "./otp.controller.js";

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
  // For development, bypass OTP verification with default "1234"
  // if (otp === "1234") {
  //   return true;
  // }

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

// export const LoginUser = async (req, res) => {
//   try {
//     const { PR_MOBILE_NO, otp, selectedUserId } = req.body;

//     // Validation
//     const schema = Joi.object({
//       PR_MOBILE_NO: Joi.string()
//         .pattern(/^[6-9]\d{9}$/)
//         .required(),
//       otp: Joi.string().optional(),
//       selectedUserId: Joi.number().optional(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message,
//       });
//     }

//     // OTP Check
//     if (!otp) {
//       const userExists = await prisma.peopleRegistry.count({
//         where: { PR_MOBILE_NO },
//       });
//       return res.status(userExists ? 200 : 404).json({
//         success: !!userExists,
//         message: userExists ? "OTP required" : "Mobile not registered",
//       });
//     }

//     if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }

//     // User Fetching
//     const users = await prisma.peopleRegistry.findMany({
//       where: { PR_MOBILE_NO },
//       include: {
//         Children: true,
//         City: true,
//         Profession: true,
//         BUSSINESS: true,
//       },
//       orderBy: { PR_ID: "desc" },
//     });

//     if (!users.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found",
//       });
//     }

//     // User Selection
//     const user = selectedUserId
//       ? users.find((u) => u.PR_ID === selectedUserId)
//       : users[0];

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid user selection",
//       });
//     }

//     // Token Generation
//     const token = generateToken(user);

//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       data: user,
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

export const LoginUser = async (req, res) => {
  try {
    const { PR_MOBILE_NO, otp, selectedUserId } = req.body;

    // ✅ 1. Validation
    const schema = Joi.object({
      PR_MOBILE_NO: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required(),
      otp: Joi.string().optional(),
      selectedUserId: Joi.number().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // ✅ 2. If OTP is not provided, generate and send it
    if (!otp) {
      const userExists = await prisma.peopleRegistry.count({
        where: { PR_MOBILE_NO },
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Mobile not registered",
        });
      }

      // Generate OTP using generateotp from otp.controller.js
      const mockReq = { body: { PR_MOBILE_NO } };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            res.status(code).json(data);
          },
        }),
        json: (data) => res.status(200).json(data),
      };

      return await generateotp(mockReq, mockRes); // ✅ Call the real OTP generator
    }

    // ✅ 3. Verify OTP
    const isOtpValid = await prisma.otp.findFirst({
      where: { PR_MOBILE_NO, otp },
    });

    if (!isOtpValid || new Date() > isOtpValid.expiresAt) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // ✅ 4. Fetch user(s) after OTP is validated
    const users = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO },
      include: {
        Children: true,
        City: true,
        Profession: true,
        BUSSINESS: true,
      },
      orderBy: { PR_ID: "desc" },
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    // ✅ 5. Handle multiple users
    const user = selectedUserId
      ? users.find((u) => u.PR_ID === selectedUserId)
      : users[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid user selection",
      });
    }

    // ✅ 6. Generate token
    const token = generateToken(user);

    // ✅ 7. Optional: Delete OTP after successful login
    await prisma.otp.deleteMany({ where: { PR_MOBILE_NO } });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
