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

dotenv.config();

const twillo_Phone_Number = +16203019559;

const twilioClient = twilio(
  process.env.Twillo_Account_SID,
  process.env.Twillo_Auth_Token
);

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
//       otp = "1234",
//       Children,
//     } = req.body;

//     console.log("-------reqbody------", req.body);

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
//         CITY_ID: CITY_ID,
//       },
//     });

//     // if (!city) {
//     //   city = await prisma.city.create({
//     //     data: {
//     //       CITY_PIN_CODE: PR_PIN_CODE,
//     //       CITY_NAME: PR_CITY_NAME,
//     //       CITY_DS_CODE: PR_DISTRICT_CODE,
//     //       CITY_DS_NAME: PR_DISTRICT_NAME,
//     //       CITY_ST_CODE: PR_STATE_CODE,
//     //       CITY_ST_NAME: PR_STATE_NAME,
//     //     },
//     //   });
//     // }

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
//           CITY_CREATED_BY: 1,
//         },
//       });

//       await prisma.bUSSINESS.update({
//         where: { BUSS_ID: business.BUSS_ID },
//         data: { BUSS_ID: business.BUSS_ID },
//       });
//     }

//     // Check for existing users with same mobile number
//     const existingUsers = await prisma.peopleRegistry.findMany({
//       where: { PR_MOBILE_NO: PR_MOBILE_NO },
//       orderBy: { PR_ID: "desc" },
//     });

//     let familyNumber = "001";
//     let memberNumber = "001";

//     if (existingUsers.length > 0) {
//       // Check if user with same name exists
//       // const existingUserWithSameName = existingUsers.find(
//       //   (user) => user.PR_FULL_NAME.toLowerCase() === PR_FULL_NAME.toLowerCase()
//       // );

//       // if (existingUserWithSameName) {
//       //   return res.status(400).json({
//       //     message: "User with this mobile and name already exists",
//       //     success: false,
//       //   });
//       // }

//       // Get the latest user with this mobile to get family number
//       const latestUser = existingUsers[0];
//       const existingIdParts = latestUser.PR_UNIQUE_ID.split("-");

//       if (existingIdParts.length === 4) {
//         familyNumber = existingIdParts[2];
//         // Find the highest member number for this family
//         const familyMembers = await prisma.peopleRegistry.findMany({
//           where: {
//             PR_UNIQUE_ID: {
//               startsWith: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-`,
//             },
//           },
//         });

//         let maxMemberNumber = 0;
//         familyMembers.forEach((member) => {
//           const parts = member.PR_UNIQUE_ID.split("-");
//           if (parts.length === 4) {
//             const num = parseInt(parts[3]);
//             if (num > maxMemberNumber) maxMemberNumber = num;
//           }
//         });

//         memberNumber = (maxMemberNumber + 1).toString().padStart(3, "0");
//       }
//     } else {
//       // New mobile number - find the next available family number
//       const lastUserInArea = await prisma.peopleRegistry.findFirst({
//         where: {
//           PR_STATE_CODE: PR_STATE_CODE,
//           PR_DISTRICT_CODE: PR_DISTRICT_CODE,
//           PR_CITY_CODE: city.CITY_ID,
//         },
//         orderBy: { PR_ID: "desc" },
//       });

//       if (lastUserInArea) {
//         const lastIdParts = lastUserInArea.PR_UNIQUE_ID.split("-");
//         if (lastIdParts.length === 4) {
//           const lastFamilyNum = parseInt(lastIdParts[2]);
//           familyNumber = (lastFamilyNum + 1).toString().padStart(3, "0");
//         }
//       }
//     }

//     const professionId =
//       PR_PROFESSION_ID && PR_PROFESSION_ID !== 0 ? PR_PROFESSION_ID : null;

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

//     const newUser = await prisma.peopleRegistry.create({
//       data: {
//         PR_UNIQUE_ID: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${memberNumber}`,
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
//         PR_CITY_CODE: city?.CITY_ID,
//         PR_STATE_CODE,
//         PR_DISTRICT_CODE,
//         PR_FAMILY_NO: familyNumber, // Added family number
//         PR_MEMBER_NO: memberNumber, // Added member number

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
    if (!isMobileVerified) {
      return res.status(400).json({
        message: "Please verify your mobile number first",
        success: false,
      });
    }

    // 🔁 Get City
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
          CITY_DS_NAME: PR_DISTRICT_NAME || "",
          CITY_ST_NAME: PR_STATE_NAME || "",
        },
      });
    }

    const cityId = city?.CITY_ID;

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

    // 📌 Fetch existing users with this mobile number
    const existingUsers = await prisma.peopleRegistry.findMany({
      where: { PR_MOBILE_NO: PR_MOBILE_NO },
      orderBy: { PR_ID: "asc" },
    });

    let familyNumber = "001";
    let memberNumber = "001";

    if (existingUsers.length > 0) {
      // const latestUser = existingUsers[0];
      familyNumber = existingUsers[0].PR_FAMILY_NO;

      const familyMembers = await prisma.peopleRegistry.findMany({
        where: {
          PR_MOBILE_NO: PR_MOBILE_NO,
          PR_FAMILY_NO: familyNumber,
          // PR_CITY_CODE: cityId,
        },
      });

      // let maxMember = 0;
      // familyMembers.forEach((member) => {
      //   const parts = member.PR_UNIQUE_ID.split("-");
      //   if (parts.length === 4) {
      //     const num = parseInt(parts[3]);
      //     if (num > maxMember) maxMember = num;
      //   }
      // });

      memberNumber = (familyMembers.length + 1).toString().padStart(3, "0");
    } else {
      familyNumber = await getNextFamilyNumber(
        PR_STATE_CODE,
        PR_DISTRICT_CODE,
        cityId
      );
    }

    const professionId =
      PR_PROFESSION_ID && PR_PROFESSION_ID !== 0 ? PR_PROFESSION_ID : null;

    const isCompleted =
      PR_FULL_NAME &&
      PR_DOB &&
      PR_MOBILE_NO &&
      PR_PIN_CODE &&
      PR_AREA_NAME &&
      PR_ADDRESS &&
      PR_FATHER_NAME &&
      PR_MOTHER_NAME
        ? "Y"
        : "N";

    const newUser = await prisma.peopleRegistry.create({
      data: {
        PR_UNIQUE_ID: `${PR_STATE_CODE}${PR_DISTRICT_CODE}-${cityId}-${familyNumber}-${memberNumber}`,
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
        PR_CITY_CODE: cityId,
        PR_STATE_CODE,
        PR_DISTRICT_CODE,
        PR_FAMILY_NO: familyNumber,
        PR_MEMBER_NO: memberNumber,
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
      await Promise.all(childPromises);
    }

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
//     const { PR_MOBILE_NO, otp = "1234", selectedUserId } = req.body;

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

//     // Step 1: First check if OTP is provided
//     if (!otp) {
//       // Check if mobile number exists in database (but don't return users yet)
//       const userCount = await prisma.peopleRegistry.count({
//         where: { PR_MOBILE_NO },
//       });

//       if (userCount === 0) {
//         return res.status(400).json({
//           message: "This mobile number is not registered",
//           success: false,
//         });
//       }

//       // For any case (single or multiple users), first require OTP verification
//       return res.status(200).json({
//         message: "OTP sent successfully",
//         success: true,
//         otpRequired: true,
//         debugOtp: "1234", // Remove in production
//       });
//     }

//     // Step 2: Verify OTP (skip if using default in development)
//     const isVerified = await checkMobileVerified(PR_MOBILE_NO, otp);
//     if (!isVerified) {
//       return res.status(400).json({
//         message: "Invalid or expired OTP",
//         success: false,
//       });
//     }

//     // Step 3: Now that OTP is verified, check for users
//     const existingUsers = await prisma.peopleRegistry.findMany({
//       where: { PR_MOBILE_NO },
//       orderBy: { PR_ID: "desc" },
//       include: {
//         Profession: true,
//         City: true,
//         Children: true,
//       },
//     });

//     if (!existingUsers || existingUsers.length === 0) {
//       return res.status(400).json({
//         message: "This mobile number is not registered",
//         success: false,
//       });
//     }

//     // Step 4: Handle user selection if multiple accounts exist
//     let user;
//     if (existingUsers.length === 1) {
//       user = existingUsers[0];
//     } else {
//       if (!selectedUserId) {
//         return res.status(200).json({
//           message: "Multiple accounts found",
//           success: true,
//           multipleUsers: true,
//           users: existingUsers.map((user) => ({
//             PR_ID: user.PR_ID,
//             PR_FULL_NAME: user.PR_FULL_NAME,
//             PR_UNIQUE_ID: user.PR_UNIQUE_ID,
//             PR_PROFESSION: user.Profession?.PROF_NAME,
//             PR_PHOTO_URL: user.PR_PHOTO_URL,
//           })),
//         });
//       }

//       user = existingUsers.find((u) => u.PR_ID === selectedUserId);
//       if (!user) {
//         return res.status(400).json({
//           message: "Invalid user selection",
//           success: false,
//         });
//       }
//     }

//     // Step 5: Generate token for the selected user
//     const token = generateToken(user);

//     // Prepare complete user data for response
//     const responseUser = {
//       PR_ID: user.PR_ID,
//       PR_FULL_NAME: user.PR_FULL_NAME,
//       PR_UNIQUE_ID: user.PR_UNIQUE_ID,
//       PR_MOBILE_NO: user.PR_MOBILE_NO,
//       PR_GENDER: user.PR_GENDER,
//       PR_ADDRESS: user.PR_ADDRESS,
//       PR_PHOTO_URL: user.PR_PHOTO_URL,
//       PR_DOB: user.PR_DOB,
//       PR_PIN_CODE: user.PR_PIN_CODE,
//       PR_STATE_CODE: user.PR_STATE_CODE,
//       PR_DISTRICT_CODE: user.PR_DISTRICT_CODE,
//       PR_AREA_NAME: user.PR_AREA_NAME,
//       PR_EDUCATION: user.PR_EDUCATION,
//       PR_EDUCATION_DESC: user.PR_EDUCATION_DESC,
//       PR_PROFESSION_DETA: user.PR_PROFESSION_DETA,
//       PR_FATHER_NAME: user.PR_FATHER_NAME,
//       PR_MOTHER_NAME: user.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: user.PR_SPOUSE_NAME,
//       PR_MARRIED_YN: user.PR_MARRIED_YN,
//       PR_BUSS_INTER: user.PR_BUSS_INTER || "N",
//       PR_BUSS_STREAM: user.PR_BUSS_STREAM || "",
//       PR_BUSS_TYPE: user.PR_BUSS_TYPE || "",
//       PR_HOBBY: user.PR_HOBBY || [],
//       Profession: {
//         PROF_ID: user.Profession?.PROF_ID,
//         PROF_NAME: user.Profession?.PROF_NAME,
//       },
//       City: {
//         CITY_ST_NAME: user.City?.CITY_ST_NAME,
//         CITY_DS_NAME: user.City?.CITY_DS_NAME,
//       },
//       Children: user.Children || [],
//     };

//     return res.status(200).json({
//       message: "Login successful",
//       success: true,
//       token,
//       user: responseUser,
//     });
//   } catch (error) {
//     console.error("Error logging in:", error);
//     return res.status(500).json({
//       message: "Something went wrong",
//       success: false,
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

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
    const { districtCode, cityCode, familyNo } = req.params;

    // Convert and validate numerical codes
    const districtCodeNumber = parseInt(districtCode, 10);
    const cityCodeNumber = parseInt(cityCode, 10);

    if (isNaN(districtCodeNumber) || isNaN(cityCodeNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid district or city code format",
      });
    }

    const familyMembers = await prisma.peopleRegistry.findMany({
      where: {
        PR_DISTRICT_CODE: districtCodeNumber,
        PR_CITY_CODE: cityCodeNumber,
        PR_FAMILY_NO: familyNo, // Keep as string if family numbers are alphanumeric
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
      orderBy: { PR_ID: "asc" },
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
