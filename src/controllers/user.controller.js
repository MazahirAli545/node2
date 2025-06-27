import { PrismaClient } from "@prisma/client/extension";
import { verifyFunc, verifyotp, generateotp } from "./otp.controller.js";
import prisma from "../db/prismaClient.js";
import Joi from "joi";
import twilio from "twilio";
import dotenv from "dotenv";
import otpGenerator from "otp-generator";
import { generateToken } from "../middlewares/jwt.js";
import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";

dotenv.config();

const twillo_Phone_Number = +16203019559;
const twilioClient = twilio(
  process.env.Twillo_Account_SID,
  process.env.Twillo_Auth_Token
);

export const registerUser = async (req, res) => {
  try {
    const {
      PR_MOBILE_NO,
      otp,
      Children,
      PR_FCM_TOKEN,
      PR_FATHER_ID,
      PR_MOTHER_ID,
      PR_SPOUSE_ID,
      ...profileData
    } = req.body;

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
      PR_FATHER_ID: Joi.string().optional().allow(""),
      PR_MOTHER_ID: Joi.string().optional().allow(""),
      PR_SPOUSE_ID: Joi.string().optional().allow(""),
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

    // Validate no duplicate IDs
    if (PR_FATHER_ID && PR_MOTHER_ID && PR_FATHER_ID === PR_MOTHER_ID) {
      return res.status(400).json({
        success: false,
        message: "Father and Mother IDs cannot be the same",
      });
    }

    if (PR_FATHER_ID && PR_SPOUSE_ID && PR_FATHER_ID === PR_SPOUSE_ID) {
      return res.status(400).json({
        success: false,
        message: "Father and Spouse IDs cannot be the same",
      });
    }

    if (PR_MOTHER_ID && PR_SPOUSE_ID && PR_MOTHER_ID === PR_SPOUSE_ID) {
      return res.status(400).json({
        success: false,
        message: "Mother and Spouse IDs cannot be the same",
      });
    }

    // 1. Validate Father ID if provided
    if (PR_FATHER_ID && PR_FATHER_ID.trim()) {
      const father = await prisma.$queryRaw`
        SELECT PR_GENDER, PR_FULL_NAME
        FROM "PeopleRegistry" 
        WHERE "PR_UNIQUE_ID" = ${PR_FATHER_ID}
        AND "PR_GENDER" = 'M'
      `;

      if (!father || father.length === 0) {
        // Check if ID exists but has wrong gender
        const existsWithWrongGender = await prisma.peopleRegistry.findFirst({
          where: {
            PR_UNIQUE_ID: PR_FATHER_ID,
            NOT: { PR_GENDER: "M" },
          },
          select: { PR_GENDER: true, PR_FULL_NAME: true },
        });

        if (existsWithWrongGender) {
          return res.status(400).json({
            success: false,
            message: "Invalid Father ID - must be male",
            details: {
              providedId: PR_FATHER_ID,
              foundGender: existsWithWrongGender.PR_GENDER,
              requiredGender: "M",
            },
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Father ID not found",
          });
        }
      }
      // Set father name if validation passes
      profileData.PR_FATHER_NAME = father[0].PR_FULL_NAME;
    }

    // 2. Validate Mother ID if provided
    if (PR_MOTHER_ID && PR_MOTHER_ID.trim()) {
      const mother = await prisma.$queryRaw`
        SELECT PR_GENDER, PR_FULL_NAME
        FROM "PeopleRegistry" 
        WHERE "PR_UNIQUE_ID" = ${PR_MOTHER_ID}
        AND "PR_GENDER" = 'F'
      `;

      if (!mother || mother.length === 0) {
        // Check if ID exists but has wrong gender
        const existsWithWrongGender = await prisma.peopleRegistry.findFirst({
          where: {
            PR_UNIQUE_ID: PR_MOTHER_ID,
            NOT: { PR_GENDER: "F" },
          },
          select: { PR_GENDER: true, PR_FULL_NAME: true },
        });

        if (existsWithWrongGender) {
          return res.status(400).json({
            success: false,
            message: "Invalid Mother ID - must be female",
            details: {
              providedId: PR_MOTHER_ID,
              foundGender: existsWithWrongGender.PR_GENDER,
              requiredGender: "F",
            },
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Mother ID not found",
          });
        }
      }
      // Set mother name if validation passes
      profileData.PR_MOTHER_NAME = mother[0].PR_FULL_NAME;
    }

    // 3. Validate Spouse ID if provided
    if (PR_SPOUSE_ID && PR_SPOUSE_ID.trim()) {
      const spouse = await prisma.peopleRegistry.findFirst({
        where: { PR_UNIQUE_ID: PR_SPOUSE_ID },
        select: { PR_GENDER: true, PR_FULL_NAME: true },
      });

      if (!spouse) {
        return res.status(404).json({
          success: false,
          message: "Spouse ID not found",
        });
      }

      // Set spouse name if validation passes
      profileData.PR_SPOUSE_NAME = spouse.PR_FULL_NAME;
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
          PR_FCM_TOKEN: PR_FCM_TOKEN || null,
          PR_FATHER_ID: PR_FATHER_ID || null,
          PR_MOTHER_ID: PR_MOTHER_ID || null,
          PR_SPOUSE_ID: PR_SPOUSE_ID || null,
          ...profileData,
          PR_IS_COMPLETED: "Y",
          PR_LANG: profileData.PR_LANG || "en",
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

      const token = generateToken(newUser.PR_ID);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        data: completeUser,
      });
    });
  } catch (error) {
    console.error("Registration Error:", error);
    const errorResponse = {
      success: false,
      message: "Internal server error",
    };

    if (error.code === "P2002") {
      errorResponse.message = "A user with this unique ID already exists.";
      return res.status(409).json(errorResponse);
    }

    if (process.env.NODE_ENV === "development") {
      errorResponse.error = error.message;
    }

    return res.status(500).json(errorResponse);
  }
};

// export const updateLanguage = async (req, res) => {
//   try {
//     const { PR_LANG } = req.body;
//     const pr_id_header = req.headers.pr_id; // Assuming pr_id is passed in headers

//     if (!pr_id_header) {
//       return res.status(400).json({
//         success: false,
//         message: "PR_ID is required in headers",
//       });
//     }

//     // Validate PR_LANG
//     const languageSchema = Joi.object({
//       PR_LANG: Joi.string().valid("hi", "en").required(), // Assuming 'hi' for Hindi and 'en' for English
//     });

//     const { error } = languageSchema.validate({ PR_LANG });
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message,
//       });
//     }

//     const pr_id = parseInt(pr_id_header, 10);

//     const updatedUser = await prisma.peopleRegistry.update({
//       where: { PR_ID: pr_id },
//       data: { PR_LANG: PR_LANG },
//     });

//     if (!updatedUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found or language not updated",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Language updated successfully",
//       data: {
//         PR_ID: updatedUser.PR_ID,
//         PR_LANG: updatedUser.PR_LANG,
//       },
//     });
//   } catch (error) {
//     console.error("Error updating language:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// export const getLanguage = async (req, res) => {
//   try {
//     const pr_id_header = req.headers.pr_id; // Assuming pr_id is passed in headers

//     if (!pr_id_header) {
//       return res.status(400).json({
//         success: false,
//         message: "PR_ID is required in headers",
//       });
//     }

//     const pr_id = parseInt(pr_id_header, 10);

//     const user = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: pr_id },
//       select: { PR_LANG: true },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Language fetched successfully",
//       data: {
//         PR_LANG: user.PR_LANG,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching language:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

export const getLanguage = async (req, res) => {
  try {
    const userId = req.headers.pr_id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not provided in headers",
      });
    }

    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: parseInt(userId, 10) },
      select: { PR_LANG: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language fetched successfully",
      data: { PR_LANG: user.PR_LANG || "en" },
    });
  } catch (error) {
    console.error("Error fetching language:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateLanguage = async (req, res) => {
  try {
    const userId = req.headers.pr_id;
    const { PR_LANG } = req.body;

    // if (!userId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "User ID not provided in headers",
    //   });
    // }

    if (!PR_LANG) {
      return res.status(400).json({
        success: false,
        message: "Language not provided in request body",
      });
    }

    await prisma.peopleRegistry.update({
      where: { PR_ID: parseInt(userId, 10) },
      data: { PR_LANG },
    });

    return res.status(200).json({
      success: true,
      message: "Language updated successfully",
    });
  } catch (error) {
    console.error("Error updating language:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const checkMobileVerified = async (mobile, otp) => {
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
    if (!/^[6-9]\d{9}$/.test(PR_MOBILE_NO)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
      });
    }

    if (!otp) {
      const userExists = await prisma.peopleRegistry.count({
        where: { PR_MOBILE_NO },
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "Mobile number not registered",
        });
      }

      // Generate and send OTP
      const mockReq = { body: { PR_MOBILE_NO } };
      const mockRes = {
        json: (data) => data,
        status: () => ({ json: (data) => data }),
      };

      const otpResponse = await generateotp(mockReq, mockRes);
      if (!otpResponse?.success) {
        return res.status(otpResponse?.statusCode || 500).json({
          success: false,
          message: otpResponse?.message || "Failed to send OTP",
        });
      }

      return res.json({
        success: true,
        message: "OTP sent successfully",
        otpRequired: true,
      });
    }

    if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const users = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO },
      orderBy: { PR_ID: "desc" },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found with this mobile number",
      });
    }

    if (users.length > 1 && !selectedUserId) {
      return res.json({
        success: true,
        message: "Multiple accounts found",
        multipleUsers: true,
        users: users.map((user) => ({
          PR_ID: user.PR_ID,
          PR_FULL_NAME: user.PR_FULL_NAME,
          PR_UNIQUE_ID: user.PR_UNIQUE_ID,
          PR_PROFESSION: user.Profession?.PROF_NAME,
          PR_PHOTO_URL: user.PR_PHOTO_URL,
        })),
      });
    }

    const user = selectedUserId
      ? users.find((u) => u.PR_ID === selectedUserId)
      : users[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid user selection",
      });
    }

    await prisma.otp.deleteMany({ where: { PR_MOBILE_NO } });

    const token = generateToken(user);
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        ...user,
        PR_LANG: user.PR_LANG || "en",
        Children: user.Children || [],
        Profession: user.Profession
          ? {
              PROF_ID: user.Profession.PROF_ID,
              PROF_NAME: user.Profession.PROF_NAME,
            }
          : null,
        City: user.City
          ? {
              CITY_ST_NAME: user.City.CITY_ST_NAME,
              CITY_DS_NAME: user.City.CITY_DS_NAME,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { PR_ID } = req.body;
    const authToken = req.headers.authorization?.split(" ")[1];

    // Validate required fields
    if (!PR_ID) {
      return res.status(400).json({
        success: false,
        message: "User ID (PR_ID) is required",
      });
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Optionally: Add token to blacklist if using JWT
    // await prisma.blacklistedToken.create({
    //   data: {
    //     token: authToken,
    //     expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    //   }
    // });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const checkPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // type: 'father', 'mother', 'spouse'

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid PR_UNIQUE_ID format",
      });
    }

    // Determine required gender based on type
    const requiredGender =
      type === "father" ? "M" : type === "mother" ? "F" : null;

    // First check if person exists with the given ID
    const personExists = await prisma.peopleRegistry.count({
      where: { PR_UNIQUE_ID: id },
    });

    if (!personExists) {
      return res.status(404).json({
        success: false,
        message: "Person with this ID does not exist",
      });
    }

    // If type requires specific gender, validate it
    if (requiredGender) {
      const isValid = await prisma.peopleRegistry.count({
        where: {
          PR_UNIQUE_ID: id,
          PR_GENDER: requiredGender,
        },
      });

      if (!isValid) {
        // Get the actual gender for error reporting
        const actualPerson = await prisma.peopleRegistry.findFirst({
          where: { PR_UNIQUE_ID: id },
          select: { PR_GENDER: true, PR_FULL_NAME: true },
        });

        return res.status(400).json({
          success: false,
          message: `Invalid gender for ${type}. Required: ${requiredGender}, Found: ${
            actualPerson?.PR_GENDER || "unknown"
          }`,
          details: {
            id,
            requiredGender,
            actualGender: actualPerson?.PR_GENDER,
          },
        });
      }
    }

    // If we get here, validation passed
    const person = await prisma.peopleRegistry.findFirst({
      where: { PR_UNIQUE_ID: id },
      select: {
        PR_ID: true,
        PR_FULL_NAME: true,
        PR_GENDER: true,
        PR_UNIQUE_ID: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Validation successful",
      data: person,
    });
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during validation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const convertUniqueIdToId = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    if (!uniqueId?.trim()) {
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

export const getFamilyMembers = async (req, res) => {
  try {
    const districtCode = req.params.districtCode;
    const cityCode = parseInt(req.params.cityCode, 10);
    const familyNo = req.params.familyNo;

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
