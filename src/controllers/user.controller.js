// import { PrismaClient } from "@prisma/client/extension";
// import { verifyFunc, verifyotp, generateotp } from "./otp.controller.js";
// import prisma from "../db/prismaClient.js";
// // import { z } from "zod";
// // import { z } from require("zod");
// import Joi from "joi";
// import twilio from "twilio";
// import dotenv from "dotenv";
// import otpGenerator from "otp-generator";
// import { generateToken } from "../middlewares/jwt.js";
// import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";
// import { parse } from "path";

// dotenv.config();

// const twillo_Phone_Number = +16203019559;

// const twilioClient = twilio(
//   process.env.Twillo_Account_SID,
//   process.env.Twillo_Auth_Token
// );

// // export const registerUser = async (req, res) => {
// //   try {
// //     const { PR_MOBILE_NO, otp, Children, PR_FCM_TOKEN, ...profileData } =
// //       req.body;

// //     // Validation Schema
// //     const schema = Joi.object({
// //       PR_MOBILE_NO: Joi.string()
// //         .pattern(/^[6-9]\d{9}$/)
// //         .required()
// //         .messages({ "string.pattern.base": "Invalid mobile number" }),
// //       PR_FULL_NAME: Joi.string().min(3).max(100).required(),
// //       PR_DOB: Joi.date().required(),
// //       PR_GENDER: Joi.string().valid("M", "F", "O").required(),
// //       PR_PIN_CODE: Joi.string().length(6).required(),
// //       PR_STATE_CODE: Joi.string().required(),
// //       PR_DISTRICT_CODE: Joi.string().required(),
// //       PR_CITY_NAME: Joi.string().required(),
// //       PR_BUSS_STREAM: Joi.string().optional(),
// //       PR_BUSS_TYPE: Joi.string().optional(),
// //       Children: Joi.array()
// //         .items(
// //           Joi.object({
// //             name: Joi.string().required(),
// //             dob: Joi.date().required(),
// //           })
// //         )
// //         .optional(),
// //     });

// //     const { error } = schema.validate(req.body);
// //     if (error) {
// //       return res.status(400).json({
// //         success: false,
// //         message: error.details[0].message,
// //       });
// //     }

// //     // OTP Verification
// //     if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Mobile verification failed",
// //       });
// //     }

// //     return await prisma.$transaction(async (tx) => {
// //       // City Handling
// //       const city = await tx.city.upsert({
// //         where: {
// //           CITY_NAME_DS_ST: {
// //             CITY_NAME: profileData.PR_CITY_NAME,
// //             CITY_DS_CODE: profileData.PR_DISTRICT_CODE,
// //             CITY_ST_CODE: profileData.PR_STATE_CODE,
// //           },
// //         },
// //         update: {},
// //         create: {
// //           CITY_NAME: profileData.PR_CITY_NAME,
// //           CITY_DS_CODE: profileData.PR_DISTRICT_CODE,
// //           CITY_ST_CODE: profileData.PR_STATE_CODE,
// //           CITY_PIN_CODE: profileData.PR_PIN_CODE,
// //           CITY_DS_NAME: "",
// //           CITY_ST_NAME: "",
// //         },
// //       });

// //       // Business Handling
// //       const business =
// //         profileData.PR_BUSS_STREAM && profileData.PR_BUSS_TYPE
// //           ? await tx.bUSSINESS.upsert({
// //               where: {
// //                 BUSS_STREM_TYPE: {
// //                   BUSS_STREM: profileData.PR_BUSS_STREAM,
// //                   BUSS_TYPE: profileData.PR_BUSS_TYPE,
// //                 },
// //               },
// //               update: {},
// //               create: {
// //                 BUSS_STREM: profileData.PR_BUSS_STREAM,
// //                 BUSS_TYPE: profileData.PR_BUSS_TYPE,
// //                 CITY_CREATED_BY: 1,
// //               },
// //             })
// //           : null;

// //       // Family Number Generation
// //       const existingUsers = await tx.peopleRegistry.findMany({
// //         where: { PR_MOBILE_NO },
// //         orderBy: { PR_ID: "desc" },
// //       });

// //       const familyNumber =
// //         existingUsers.length > 0
// //           ? existingUsers[0].PR_FAMILY_NO
// //           : await getNextFamilyNumber(
// //               profileData.PR_STATE_CODE,
// //               profileData.PR_DISTRICT_CODE,
// //               city.CITY_ID
// //             );

// //       const memberNumber = (existingUsers.length + 1)
// //         .toString()
// //         .padStart(4, "0");

// //       // User Creation
// //       const newUser = await tx.peopleRegistry.create({
// //         data: {
// //           PR_UNIQUE_ID: `${profileData.PR_STATE_CODE}${profileData.PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${memberNumber}`,
// //           PR_FAMILY_NO: familyNumber,
// //           PR_MEMBER_NO: memberNumber,
// //           PR_MOBILE_NO,
// //           PR_DOB: new Date(profileData.PR_DOB).toISOString(),
// //           PR_CITY_CODE: city.CITY_ID,
// //           PR_BUSS_CODE: business?.BUSS_ID || null,
// //           PR_FCM_TOKEN: PR_FCM_TOKEN || null,
// //           ...profileData,
// //           PR_IS_COMPLETED: "Y", // Assuming full registration
// //         },
// //       });

// //       // Children Handling
// //       if (Children && Children.length > 0) {
// //         await tx.child.createMany({
// //           data: Children.map((child) => ({
// //             name: child.name,
// //             dob: new Date(child.dob).toISOString(),
// //             userId: newUser.PR_ID,
// //           })),
// //         });
// //       }

// //       // Final Response
// //       const completeUser = await tx.peopleRegistry.findUnique({
// //         where: { PR_ID: newUser.PR_ID },
// //         include: { Children: true, City: true, BUSSINESS: true },
// //       });

// //       return res.status(201).json({
// //         success: true,
// //         message: "User registered successfully",
// //         data: completeUser,
// //       });
// //     });
// //   } catch (error) {
// //     console.error("Registration Error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //       error: process.env.NODE_ENV === "development" ? error.message : undefined,
// //     });
// //   }
// // };

// export const registerUser = async (req, res) => {
//   try {
//     const {
//       PR_MOBILE_NO,
//       otp,
//       Children,
//       PR_FCM_TOKEN,
//       PR_FATHER_ID,
//       PR_MOTHER_ID,
//       ...profileData
//     } = req.body;

//     // Validation Schema
//     const schema = Joi.object({
//       PR_MOBILE_NO: Joi.string()
//         .pattern(/^[6-9]\d{9}$/)
//         .required()
//         .messages({ "string.pattern.base": "Invalid mobile number" }),
//       PR_FULL_NAME: Joi.string().min(3).max(100).required(),
//       PR_DOB: Joi.date().required(),
//       PR_GENDER: Joi.string().valid("M", "F", "O").required(),
//       PR_PIN_CODE: Joi.string().length(6).required(),
//       PR_STATE_CODE: Joi.string().required(),
//       PR_DISTRICT_CODE: Joi.string().required(),
//       PR_CITY_NAME: Joi.string().required(),
//       PR_BUSS_STREAM: Joi.string().optional(),
//       PR_BUSS_TYPE: Joi.string().optional(),
//       PR_FATHER_ID: Joi.string().optional().allow(""),
//       PR_MOTHER_ID: Joi.string().optional().allow(""),
//       Children: Joi.array()
//         .items(
//           Joi.object({
//             name: Joi.string().required(),
//             dob: Joi.date().required(),
//           })
//         )
//         .optional(),
//     });

//     const { error } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message,
//       });
//     }

//     // OTP Verification
//     if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
//       return res.status(401).json({
//         success: false,
//         message: "Mobile verification failed",
//       });
//     }

//     // 1. Validate Father ID if provided
//     if (PR_FATHER_ID && PR_FATHER_ID.trim()) {
//       const father = await prisma.$queryRaw`
//         SELECT PR_GENDER, PR_FULL_NAME
//         FROM "PeopleRegistry"
//         WHERE "PR_UNIQUE_ID" = ${PR_FATHER_ID}
//         AND "PR_GENDER" = 'M'
//       `;

//       if (!father || father.length === 0) {
//         // Check if ID exists but has wrong gender
//         const existsWithWrongGender = await prisma.peopleRegistry.findFirst({
//           where: {
//             PR_UNIQUE_ID: PR_FATHER_ID,
//             NOT: { PR_GENDER: "M" },
//           },
//           select: { PR_GENDER: true, PR_FULL_NAME: true },
//         });

//         if (existsWithWrongGender) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid Father ID - must be male",
//             details: {
//               providedId: PR_FATHER_ID,
//               foundGender: existsWithWrongGender.PR_GENDER,
//               requiredGender: "M",
//             },
//           });
//         } else {
//           return res.status(404).json({
//             success: false,
//             message: "Father ID not found",
//           });
//         }
//       }
//       // Set father name if validation passes
//       profileData.PR_FATHER_NAME = father[0].PR_FULL_NAME;
//     }

//     // 2. Validate Mother ID if provided
//     if (PR_MOTHER_ID && PR_MOTHER_ID.trim()) {
//       const mother = await prisma.$queryRaw`
//         SELECT PR_GENDER, PR_FULL_NAME
//         FROM "PeopleRegistry"
//         WHERE "PR_UNIQUE_ID" = ${PR_MOTHER_ID}
//         AND "PR_GENDER" = 'F'
//       `;

//       if (!mother || mother.length === 0) {
//         // Check if ID exists but has wrong gender
//         const existsWithWrongGender = await prisma.peopleRegistry.findFirst({
//           where: {
//             PR_UNIQUE_ID: PR_MOTHER_ID,
//             NOT: { PR_GENDER: "F" },
//           },
//           select: { PR_GENDER: true, PR_FULL_NAME: true },
//         });

//         if (existsWithWrongGender) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid Mother ID - must be female",
//             details: {
//               providedId: PR_MOTHER_ID,
//               foundGender: existsWithWrongGender.PR_GENDER,
//               requiredGender: "F",
//             },
//           });
//         } else {
//           return res.status(404).json({
//             success: false,
//             message: "Mother ID not found",
//           });
//         }
//       }
//       // Set mother name if validation passes
//       profileData.PR_MOTHER_NAME = mother[0].PR_FULL_NAME;
//     }

//     return await prisma.$transaction(async (tx) => {
//       // City Handling
//       const city = await tx.city.upsert({
//         where: {
//           CITY_NAME_DS_ST: {
//             CITY_NAME: profileData.PR_CITY_NAME,
//             CITY_DS_CODE: profileData.PR_DISTRICT_CODE,
//             CITY_ST_CODE: profileData.PR_STATE_CODE,
//           },
//         },
//         update: {},
//         create: {
//           CITY_NAME: profileData.PR_CITY_NAME,
//           CITY_DS_CODE: profileData.PR_DISTRICT_CODE,
//           CITY_ST_CODE: profileData.PR_STATE_CODE,
//           CITY_PIN_CODE: profileData.PR_PIN_CODE,
//           CITY_DS_NAME: "",
//           CITY_ST_NAME: "",
//         },
//       });

//       // Business Handling
//       const business =
//         profileData.PR_BUSS_STREAM && profileData.PR_BUSS_TYPE
//           ? await tx.bUSSINESS.upsert({
//               where: {
//                 BUSS_STREM_TYPE: {
//                   BUSS_STREM: profileData.PR_BUSS_STREAM,
//                   BUSS_TYPE: profileData.PR_BUSS_TYPE,
//                 },
//               },
//               update: {},
//               create: {
//                 BUSS_STREM: profileData.PR_BUSS_STREAM,
//                 BUSS_TYPE: profileData.PR_BUSS_TYPE,
//                 CITY_CREATED_BY: 1,
//               },
//             })
//           : null;

//       // Family Number Generation
//       const existingUsers = await tx.peopleRegistry.findMany({
//         where: { PR_MOBILE_NO },
//         orderBy: { PR_ID: "desc" },
//       });

//       const familyNumber =
//         existingUsers.length > 0
//           ? existingUsers[0].PR_FAMILY_NO
//           : await getNextFamilyNumber(
//               profileData.PR_STATE_CODE,
//               profileData.PR_DISTRICT_CODE,
//               city.CITY_ID
//             );

//       const memberNumber = (existingUsers.length + 1)
//         .toString()
//         .padStart(4, "0");

//       // User Creation
//       const newUser = await tx.peopleRegistry.create({
//         data: {
//           PR_UNIQUE_ID: `${profileData.PR_STATE_CODE}${profileData.PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${memberNumber}`,
//           PR_FAMILY_NO: familyNumber,
//           PR_MEMBER_NO: memberNumber,
//           PR_MOBILE_NO,
//           PR_DOB: new Date(profileData.PR_DOB).toISOString(),
//           PR_CITY_CODE: city.CITY_ID,
//           PR_BUSS_CODE: business?.BUSS_ID || null,
//           PR_FCM_TOKEN: PR_FCM_TOKEN || null,
//           PR_FATHER_ID: PR_FATHER_ID || null,
//           PR_MOTHER_ID: PR_MOTHER_ID || null,
//           ...profileData,
//           PR_IS_COMPLETED: "Y",
//         },
//       });

//       // Children Handling
//       if (Children && Children.length > 0) {
//         await tx.child.createMany({
//           data: Children.map((child) => ({
//             name: child.name,
//             dob: new Date(child.dob).toISOString(),
//             userId: newUser.PR_ID,
//           })),
//         });
//       }

//       // Final Response
//       const completeUser = await tx.peopleRegistry.findUnique({
//         where: { PR_ID: newUser.PR_ID },
//         include: { Children: true, City: true, BUSSINESS: true },
//       });

//       const token = generateToken(newUser.PR_ID);

//       return res.status(201).json({
//         success: true,
//         message: "User registered successfully",
//         token,
//         data: completeUser,
//       });
//     });
//   } catch (error) {
//     console.error("Registration Error:", error);
//     const errorResponse = {
//       success: false,
//       message: "Internal server error",
//     };

//     if (error.code === "P2002") {
//       errorResponse.message = "A user with this unique ID already exists.";
//       return res.status(409).json(errorResponse);
//     }

//     if (process.env.NODE_ENV === "development") {
//       errorResponse.error = error.message;
//     }

//     return res.status(500).json(errorResponse);
//   }
// };

// const checkMobileVerified = async (mobile, otp) => {
//   const otpRecord = await prisma.otp.findFirst({
//     where: { PR_MOBILE_NO: mobile, otp },
//   });

//   if (!otpRecord || otpRecord.otp !== otp) {
//     return false;
//   }

//   if (new Date() > otpRecord.expiresAt) {
//     return false;
//   }

//   return true;
// };

// export const LoginUser = async (req, res) => {
//   try {
//     const { PR_MOBILE_NO, otp, selectedUserId } = req.body;

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
//       // Check if mobile number exists in database
//       const userCount = await prisma.peopleRegistry.count({
//         where: { PR_MOBILE_NO },
//       });

//       if (userCount === 0) {
//         return res.status(400).json({
//           message: "This mobile number is not registered",
//           success: false,
//         });
//       }

//       // Create a mock request object for generateotp
//       const mockReq = {
//         body: { PR_MOBILE_NO },
//       };

//       // Create a mock response object to capture generateotp's response
//       let otpResponse;
//       const mockRes = {
//         json: (data) => {
//           otpResponse = data;
//           return data;
//         },
//         status: (code) => ({
//           json: (data) => {
//             otpResponse = { ...data, statusCode: code };
//             return data;
//           },
//         }),
//       };

//       // Call generateotp with mock request/response
//       await generateotp(mockReq, mockRes);

//       if (!otpResponse?.success) {
//         return res.status(otpResponse?.statusCode || 500).json({
//           message: otpResponse?.message || "Failed to send OTP",
//           success: false,
//         });
//       }

//       return res.status(200).json({
//         message: "OTP sent successfully",
//         success: true,
//         otpRequired: true,
//       });
//     }

//     // Step 2: Verify OTP
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

//     // Step 6: Delete the used OTP record
//     await prisma.otp.deleteMany({
//       where: { PR_MOBILE_NO },
//     });

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

// // export const checkPersonById = async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { type } = req.query; // type: 'father', 'mother', 'spouse'

// //     // Make sure id is a non-empty string
// //     if (!id || typeof id !== "string") {
// //       return res
// //         .status(400)
// //         .json({ success: false, message: "Invalid PR_UNIQUE_ID format" });
// //     }

// //     const person = await prisma.peopleRegistry.findFirst({
// //       where: { PR_UNIQUE_ID: id },
// //       select: { PR_UNIQUE_ID: true, PR_GENDER: true, PR_FULL_NAME: true },
// //     });

// //     if (!person) {
// //       return res
// //         .status(404)
// //         .json({ success: false, message: "PR_UNIQUE_ID not present" });
// //     }

// //     // Gender validation based on type
// //     // Strict gender validation based on type
// //     if (type === "father") {
// //       if (person.PR_GENDER !== "M") {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid gender for father. Expected Male.",
// //           details: {
// //             providedId: id,
// //             foundGender: person.PR_GENDER,
// //             requiredGender: "M",
// //           },
// //         });
// //       }
// //     }

// //     if (type === "mother") {
// //       if (person.PR_GENDER !== "F") {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Invalid gender for mother. Expected Female.",
// //           details: {
// //             providedId: id,
// //             foundGender: person.PR_GENDER,
// //             requiredGender: "F",
// //           },
// //         });
// //       }
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       data: person,
// //       message: `PR_UNIQUE_ID is valid${type ? " for " + type : ""}`,
// //     });
// //   } catch (error) {
// //     console.error("Check Person Error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //     });
// //   }
// // };

// export const checkPersonById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { type } = req.query; // type: 'father', 'mother', 'spouse'

//     if (!id || typeof id !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_UNIQUE_ID format",
//       });
//     }

//     // Determine required gender based on type
//     const requiredGender =
//       type === "father" ? "M" : type === "mother" ? "F" : null;

//     // First check if person exists with the given ID
//     const personExists = await prisma.peopleRegistry.count({
//       where: { PR_UNIQUE_ID: id },
//     });

//     if (!personExists) {
//       return res.status(404).json({
//         success: false,
//         message: "Person with this ID does not exist",
//       });
//     }

//     // If type requires specific gender, validate it
//     if (requiredGender) {
//       const isValid = await prisma.peopleRegistry.count({
//         where: {
//           PR_UNIQUE_ID: id,
//           PR_GENDER: requiredGender,
//         },
//       });

//       if (!isValid) {
//         // Get the actual gender for error reporting
//         const actualPerson = await prisma.peopleRegistry.findFirst({
//           where: { PR_UNIQUE_ID: id },
//           select: { PR_GENDER: true, PR_FULL_NAME: true },
//         });

//         return res.status(400).json({
//           success: false,
//           message: `Invalid gender for ${type}. Required: ${requiredGender}, Found: ${
//             actualPerson?.PR_GENDER || "unknown"
//           }`,
//           details: {
//             id,
//             requiredGender,
//             actualGender: actualPerson?.PR_GENDER,
//           },
//         });
//       }
//     }

//     // If we get here, validation passed
//     const person = await prisma.peopleRegistry.findFirst({
//       where: { PR_UNIQUE_ID: id },
//       select: {
//         PR_ID: true,
//         PR_FULL_NAME: true,
//         PR_GENDER: true,
//         PR_UNIQUE_ID: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Validation successful",
//       data: person,
//     });
//   } catch (error) {
//     console.error("Validation error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during validation",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// export const convertUniqueIdToId = async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     if (!uniqueId?.trim()) {
//       // More thorough validation
//       return res.status(400).json({
//         success: false,
//         message: "PR_UNIQUE_ID is required",
//       });
//     }

//     const person = await prisma.peopleRegistry.findFirst({
//       where: {
//         PR_UNIQUE_ID: uniqueId.trim(),
//       },
//       select: {
//         PR_ID: true,
//         PR_UNIQUE_ID: true,
//       },
//     });

//     if (!person) {
//       return res.status(404).json({
//         success: false,
//         message: "Person not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: person,
//     });
//   } catch (error) {
//     console.error("Error in convertUniqueIdToId:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// export const getUserByUniqueId = async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     if (!uniqueId || typeof uniqueId !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_UNIQUE_ID format",
//       });
//     }

//     const user = await prisma.peopleRegistry.findFirst({
//       where: { PR_UNIQUE_ID: uniqueId },
//       select: {
//         PR_UNIQUE_ID: true,
//         PR_FULL_NAME: true,
//       },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User with this PR_UNIQUE_ID not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "User found",
//       data: user,
//     });
//   } catch (error) {
//     console.error("Error fetching user by PR_UNIQUE_ID:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// // 1. Get all families with same district and city code (with type conversion)
// export const getFamiliesByLocation = async (req, res) => {
//   try {
//     const districtCode = req.params.districtCode;
//     const cityCode = parseInt(req.params.cityCode, 10);

//     if (!districtCode || isNaN(cityCode)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid district or city code format",
//       });
//     }

//     const families = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_DISTRICT_CODE: districtCode,
//         PR_CITY_CODE: cityCode,
//       },
//       include: {
//         Children: true,
//         Profession: true,
//         City: true,
//         BUSSINESS: true,
//         Contact: true,
//         Father: true,
//         Mother: true,
//         Spouse: true,
//       },
//       orderBy: {
//         PR_FAMILY_NO: "asc",
//       },
//     });

//     if (!families || families.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No families found in this location",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       count: families.length,
//       data: families,
//     });
//   } catch (error) {
//     console.error("Error fetching families by location:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };

// // 2. Get family members (with type conversion)
// export const getFamilyMembers = async (req, res) => {
//   try {
//     const districtCode = req.params.districtCode; // string
//     const cityCode = parseInt(req.params.cityCode, 10); // int
//     const familyNo = req.params.familyNo; // string

//     if (!districtCode || isNaN(cityCode) || !familyNo) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid district, city, or family code format",
//       });
//     }

//     const familyMembers = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_DISTRICT_CODE: districtCode,
//         PR_CITY_CODE: cityCode,
//         PR_FAMILY_NO: familyNo,
//       },
//       include: {
//         Children: true,
//         Profession: true,
//         City: true,
//         BUSSINESS: true,
//         Contact: true,
//         Father: true,
//         Mother: true,
//         Spouse: true,
//       },
//       orderBy: {
//         PR_ID: "asc",
//       },
//     });

//     if (!familyMembers || familyMembers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No family members found with these details",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       count: familyMembers.length,
//       data: familyMembers,
//     });
//   } catch (error) {
//     console.error("Error fetching family members:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // import { PrismaClient } from "@prisma/client/extension";
// // import { verifyFunc, verifyotp, generateotp } from "./otp.controller.js";
// // import prisma from "../db/prismaClient.js";
// // import Joi from "joi";
// // import twilio from "twilio";
// // import dotenv from "dotenv";
// // import otpGenerator from "otp-generator";
// // import { generateToken } from "../middlewares/jwt.js";
// // import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";
// // import { parse } from "path";

// // dotenv.config();

// // // Constants
// // const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+16203019559";
// // const twilioClient = twilio(
// //   process.env.TWILLO_ACCOUNT_SID,
// //   process.env.TWILLO_AUTH_TOKEN
// // );

// // // Utility functions
// // export const checkMobileVerified = async (mobile, otp) => {
// //   try {
// //     const otpRecord = await prisma.otp.findFirst({
// //       where: { PR_MOBILE_NO: mobile, otp },
// //     });

// //     if (!otpRecord) {
// //       console.error("OTP record not found for mobile:", mobile);
// //       return false;
// //     }

// //     if (otpRecord.otp !== otp) {
// //       console.error("OTP mismatch for mobile:", mobile);
// //       return false;
// //     }

// //     if (new Date() > otpRecord.expiresAt) {
// //       console.error("OTP expired for mobile:", mobile);
// //       return false;
// //     }

// //     return true;
// //   } catch (error) {
// //     console.error("Error in checkMobileVerified:", error);
// //     return false;
// //   }
// // };

// // const validateGender = (person, expectedGender, role) => {
// //   if (!person || !person.PR_GENDER) {
// //     console.error(`${role} validation failed - person or gender missing`);
// //     return false;
// //   }

// //   const normalizedGender = person.PR_GENDER.toString().trim().toUpperCase();
// //   const isValid = normalizedGender === expectedGender.toUpperCase();

// //   if (!isValid) {
// //     console.error(`Invalid gender for ${role}:`, {
// //       expected: expectedGender,
// //       received: normalizedGender,
// //       rawValue: person.PR_GENDER,
// //     });
// //   }

// //   return isValid;
// // };

// // // Main controller functions
// // export const registerUser = async (req, res) => {
// //   try {
// //     const {
// //       PR_MOBILE_NO,
// //       otp,
// //       Children,
// //       PR_FCM_TOKEN,
// //       PR_FATHER_ID,
// //       PR_MOTHER_ID,
// //       ...profileData
// //     } = req.body;

// //     const schema = Joi.object({
// //       PR_MOBILE_NO: Joi.string()
// //         .pattern(/^[6-9]\d{9}$/)
// //         .required(),
// //       PR_FULL_NAME: Joi.string().min(3).max(100).required(),
// //       PR_DOB: Joi.date().required(),
// //       PR_GENDER: Joi.string().valid("M", "F", "O").required(),
// //       PR_PIN_CODE: Joi.string().length(6).required(),
// //       PR_STATE_CODE: Joi.string().required(),
// //       PR_DISTRICT_CODE: Joi.string().required(),
// //       PR_CITY_NAME: Joi.string().required(),
// //     }).unknown(true);

// //     const { error } = schema.validate(req.body);
// //     if (error) {
// //       return res.status(400).json({
// //         success: false,
// //         message: error.details.map((d) => d.message).join(", "),
// //       });
// //     }

// //     if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Mobile verification failed. Invalid or expired OTP.",
// //       });
// //     }

// //     // Parent validation
// //     if (PR_FATHER_ID) {
// //       const fatherPerson = await prisma.peopleRegistry.findFirst({
// //         where: { PR_UNIQUE_ID: PR_FATHER_ID },
// //         select: { PR_GENDER: true, PR_FULL_NAME: true },
// //       });

// //       if (!fatherPerson) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Father ID not found in registry.",
// //         });
// //       }

// //       // Strict gender validation for father
// //       const fatherGender = fatherPerson.PR_GENDER?.toString()
// //         .trim()
// //         .toUpperCase();
// //       if (fatherGender !== "M") {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Father ID must belong to a Male person.",
// //           debug: {
// //             receivedGender: fatherPerson.PR_GENDER,
// //             normalizedGender: fatherGender,
// //             expectedGender: "M",
// //           },
// //         });
// //       }

// //       profileData.PR_FATHER_NAME = fatherPerson.PR_FULL_NAME;
// //     }

// //     if (PR_MOTHER_ID) {
// //       const motherPerson = await prisma.peopleRegistry.findFirst({
// //         where: { PR_UNIQUE_ID: PR_MOTHER_ID },
// //         select: { PR_GENDER: true, PR_FULL_NAME: true },
// //       });

// //       if (!motherPerson || !validateGender(motherPerson, "F", "Mother")) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Mother ID must be Female.",
// //         });
// //       }
// //       profileData.PR_MOTHER_NAME = motherPerson.PR_FULL_NAME;
// //     }

// //     return await prisma.$transaction(async (tx) => {
// //       const city = await tx.city.findFirst({
// //         where: { CITY_NAME: profileData.PR_CITY_NAME },
// //       });

// //       if (!city) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "City not found.",
// //         });
// //       }

// //       const { familyNumber, memberNumber } = await getNextFamilyNumber(
// //         tx,
// //         profileData.PR_STATE_CODE,
// //         profileData.PR_DISTRICT_CODE,
// //         city.CITY_ID
// //       );

// //       const newUser = await tx.peopleRegistry.create({
// //         data: {
// //           PR_UNIQUE_ID: `${profileData.PR_STATE_CODE}${profileData.PR_DISTRICT_CODE}-${city.CITY_ID}-${familyNumber}-${memberNumber}`,
// //           PR_FAMILY_NO: familyNumber,
// //           PR_MEMBER_NO: memberNumber,
// //           PR_MOBILE_NO,
// //           PR_DOB: new Date(profileData.PR_DOB).toISOString(),
// //           PR_CITY_CODE: city.CITY_ID,
// //           PR_FCM_TOKEN: PR_FCM_TOKEN || null,
// //           PR_FATHER_ID: PR_FATHER_ID || null,
// //           PR_MOTHER_ID: PR_MOTHER_ID || null,
// //           ...profileData,
// //           PR_IS_COMPLETED: "Y",
// //           PR_CREATED_AT: new Date(),
// //           PR_UPDATED_AT: new Date(),
// //           PR_ROLE: "End User",
// //         },
// //       });

// //       if (Children?.length > 0) {
// //         await Promise.all(
// //           Children.map(async (child) => {
// //             const { familyNumber: childFamilyNo, memberNumber: childMemberNo } =
// //               await getNextFamilyNumber(
// //                 tx,
// //                 profileData.PR_STATE_CODE,
// //                 profileData.PR_DISTRICT_CODE,
// //                 city.CITY_ID
// //               );

// //             return tx.peopleRegistry.create({
// //               data: {
// //                 PR_UNIQUE_ID: `${profileData.PR_STATE_CODE}${profileData.PR_DISTRICT_CODE}-${city.CITY_ID}-${childFamilyNo}-${childMemberNo}`,
// //                 PR_FULL_NAME: child.name,
// //                 PR_DOB: new Date(child.dob).toISOString(),
// //                 PR_GENDER: child.gender || "O",
// //                 PR_FAMILY_NO: childFamilyNo,
// //                 PR_MEMBER_NO: childMemberNo,
// //                 PR_CITY_CODE: city.CITY_ID,
// //                 PR_FATHER_ID:
// //                   profileData.PR_GENDER === "M"
// //                     ? newUser.PR_UNIQUE_ID
// //                     : PR_FATHER_ID || null,
// //                 PR_MOTHER_ID:
// //                   profileData.PR_GENDER === "F"
// //                     ? newUser.PR_UNIQUE_ID
// //                     : PR_MOTHER_ID || null,
// //                 PR_CREATED_AT: new Date(),
// //                 PR_UPDATED_AT: new Date(),
// //                 PR_ROLE: "End User",
// //                 PR_IS_COMPLETED: "Y",
// //               },
// //             });
// //           })
// //         );
// //       }

// //       const token = generateToken(newUser.PR_ID);

// //       return res.status(201).json({
// //         success: true,
// //         message: "User registered successfully",
// //         token,
// //         data: newUser,
// //       });
// //     });
// //   } catch (error) {
// //     console.error("Registration Error:", error);
// //     const errorResponse = {
// //       success: false,
// //       message:
// //         error.code === "P2002"
// //           ? "A user with this unique ID already exists."
// //           : "Internal server error during registration.",
// //     };

// //     if (process.env.NODE_ENV === "development") {
// //       errorResponse.error = error.message;
// //     }

// //     return res.status(error.code === "P2002" ? 409 : 500).json(errorResponse);
// //   }
// // };

// // export const LoginUser = async (req, res) => {
// //   try {
// //     const { PR_MOBILE_NO, otp, selectedUserId } = req.body;

// //     if (!/^[6-9]\d{9}$/.test(PR_MOBILE_NO)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid mobile number format",
// //       });
// //     }

// //     if (!otp) {
// //       const userExists = await prisma.peopleRegistry.count({
// //         where: { PR_MOBILE_NO },
// //       });
// //       if (!userExists) {
// //         return res.status(404).json({
// //           success: false,
// //           message: "Mobile number not registered",
// //         });
// //       }

// //       const mockReq = { body: { PR_MOBILE_NO } };
// //       const mockRes = {
// //         json: (data) => data,
// //         status: () => ({ json: (data) => data }),
// //       };

// //       const otpResponse = await generateotp(mockReq, mockRes);
// //       if (!otpResponse?.success) {
// //         return res.status(otpResponse?.statusCode || 500).json({
// //           success: false,
// //           message: otpResponse?.message || "Failed to send OTP",
// //         });
// //       }

// //       return res.json({
// //         success: true,
// //         message: "OTP sent successfully",
// //         otpRequired: true,
// //       });
// //     }

// //     if (!(await checkMobileVerified(PR_MOBILE_NO, otp))) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "Invalid or expired OTP",
// //       });
// //     }

// //     const users = await prisma.peopleRegistry.findMany({
// //       where: { PR_MOBILE_NO },
// //       orderBy: { PR_ID: "desc" },
// //       include: {
// //         Profession: true,
// //         City: true,
// //         Children: true,
// //       },
// //     });

// //     if (!users.length) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No users found with this mobile number",
// //       });
// //     }

// //     if (users.length > 1 && !selectedUserId) {
// //       return res.json({
// //         success: true,
// //         message: "Multiple accounts found",
// //         multipleUsers: true,
// //         users: users.map((user) => ({
// //           PR_ID: user.PR_ID,
// //           PR_FULL_NAME: user.PR_FULL_NAME,
// //           PR_UNIQUE_ID: user.PR_UNIQUE_ID,
// //           PR_PROFESSION: user.Profession?.PROF_NAME,
// //           PR_PHOTO_URL: user.PR_PHOTO_URL,
// //         })),
// //       });
// //     }

// //     const user = selectedUserId
// //       ? users.find((u) => u.PR_ID === selectedUserId)
// //       : users[0];

// //     if (!user) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid user selection",
// //       });
// //     }

// //     await prisma.otp.deleteMany({ where: { PR_MOBILE_NO } });

// //     const token = generateToken(user);
// //     return res.json({
// //       success: true,
// //       message: "Login successful",
// //       token,
// //       user: {
// //         ...user,
// //         Children: user.Children || [],
// //         Profession: user.Profession
// //           ? {
// //               PROF_ID: user.Profession.PROF_ID,
// //               PROF_NAME: user.Profession.PROF_NAME,
// //             }
// //           : null,
// //         City: user.City
// //           ? {
// //               CITY_ST_NAME: user.City.CITY_ST_NAME,
// //               CITY_DS_NAME: user.City.CITY_DS_NAME,
// //             }
// //           : null,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Login Error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //       ...(process.env.NODE_ENV === "development" && { error: error.message }),
// //     });
// //   }
// // };

// // // export const checkPersonById = async (req, res) => {
// // //   try {
// // //     const { id, type } = req.params;

// // //     if (!id) {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: "ID is required.",
// // //       });
// // //     }

// // //     const person = await prisma.peopleRegistry.findFirst({
// // //       where: { PR_UNIQUE_ID: id },
// // //       select: {
// // //         PR_ID: true,
// // //         PR_FULL_NAME: true,
// // //         PR_GENDER: true,
// // //       },
// // //     });

// // //     if (!person) {
// // //       return res.status(404).json({
// // //         success: false,
// // //         message: "ID not found.",
// // //       });
// // //     }

// // //     if (type === "father" && person.PR_GENDER !== "M") {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: "Father ID must be Male.",
// // //       });
// // //     }
// // //     if (type === "mother" && person.PR_GENDER !== "F") {
// // //       return res.status(400).json({
// // //         success: false,
// // //         message: "Mother ID must be Female.",
// // //       });
// // //     }

// // //     return res.status(200).json({
// // //       success: true,
// // //       message: "ID found and valid.",
// // //       data: person,
// // //     });
// // //   } catch (error) {
// // //     console.error("Check Person By ID Error:", error);
// // //     return res.status(500).json({
// // //       success: false,
// // //       message: "Internal server error.",
// // //     });
// // //   }
// // // };

// // export const checkPersonById = async (req, res) => {
// //   try {
// //     const { id, type } = req.params;

// //     // 1. First, verify the person exists
// //     const personExists = await prisma.peopleRegistry.count({
// //       where: { PR_UNIQUE_ID: id },
// //     });

// //     if (!personExists) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Person with this ID does not exist",
// //       });
// //     }

// //     // 2. Run a STRICT gender verification query
// //     const requiredGender = type.toLowerCase() === "father" ? "M" : "F";

// //     const isValid = await prisma.peopleRegistry.count({
// //       where: {
// //         PR_UNIQUE_ID: id,
// //         PR_GENDER: requiredGender,
// //       },
// //     });

// //     // 3. If count is 0, it means the gender doesn't match
// //     if (!isValid) {
// //       // Get the actual gender for error reporting
// //       const actualPerson = await prisma.peopleRegistry.findFirst({
// //         where: { PR_UNIQUE_ID: id },
// //         select: { PR_GENDER: true },
// //       });

// //       return res.status(400).json({
// //         success: false,
// //         message: `Invalid gender for ${type}. Required: ${requiredGender}, Found: ${
// //           actualPerson?.PR_GENDER || "unknown"
// //         }`,
// //         details: {
// //           id,
// //           requiredGender,
// //           actualGender: actualPerson?.PR_GENDER,
// //         },
// //       });
// //     }

// //     // 4. If we get here, validation passed
// //     const person = await prisma.peopleRegistry.findFirst({
// //       where: { PR_UNIQUE_ID: id },
// //       select: { PR_ID: true, PR_FULL_NAME: true, PR_GENDER: true },
// //     });

// //     return res.status(200).json({
// //       success: true,
// //       message: "Validation successful",
// //       data: person,
// //     });
// //   } catch (error) {
// //     console.error("Validation error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error during validation",
// //       ...(process.env.NODE_ENV === "development" && { error: error.message }),
// //     });
// //   }
// // };
// // export const convertUniqueIdToId = async (req, res) => {
// //   try {
// //     const { uniqueId } = req.params;

// //     if (!uniqueId?.trim()) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "PR_UNIQUE_ID is required",
// //       });
// //     }

// //     const person = await prisma.peopleRegistry.findFirst({
// //       where: { PR_UNIQUE_ID: uniqueId.trim() },
// //       select: { PR_ID: true, PR_UNIQUE_ID: true },
// //     });

// //     if (!person) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Person not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       data: person,
// //     });
// //   } catch (error) {
// //     console.error("Error in convertUniqueIdToId:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //     });
// //   }
// // };

// // export const getUserByUniqueId = async (req, res) => {
// //   try {
// //     const { uniqueId } = req.params;

// //     if (!uniqueId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "PR_UNIQUE_ID is required",
// //       });
// //     }

// //     const user = await prisma.peopleRegistry.findFirst({
// //       where: { PR_UNIQUE_ID: uniqueId },
// //       select: { PR_UNIQUE_ID: true, PR_FULL_NAME: true },
// //     });

// //     if (!user) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "User not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       data: user,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching user:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Internal server error",
// //     });
// //   }
// // };

// // export const getFamiliesByLocation = async (req, res) => {
// //   try {
// //     const { districtCode, cityCode } = req.params;
// //     const cityCodeNum = parseInt(cityCode, 10);

// //     if (!districtCode || isNaN(cityCodeNum)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid district or city code",
// //       });
// //     }

// //     const families = await prisma.peopleRegistry.findMany({
// //       where: {
// //         PR_DISTRICT_CODE: districtCode,
// //         PR_CITY_CODE: cityCodeNum,
// //       },
// //       include: {
// //         Children: true,
// //         Profession: true,
// //         City: true,
// //       },
// //       orderBy: { PR_FAMILY_NO: "asc" },
// //     });

// //     if (!families.length) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No families found",
// //       });
// //     }

// //     return res.json({
// //       success: true,
// //       count: families.length,
// //       data: families,
// //     });
// //   } catch (error) {
// //     console.error("Family lookup error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Error fetching families",
// //     });
// //   }
// // };

// // export const getFamilyMembers = async (req, res) => {
// //   try {
// //     const { districtCode, cityCode, familyNo } = req.params;
// //     const cityCodeNum = parseInt(cityCode, 10);

// //     if (!districtCode || isNaN(cityCodeNum) || !familyNo) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Invalid parameters",
// //       });
// //     }

// //     const familyMembers = await prisma.peopleRegistry.findMany({
// //       where: {
// //         PR_DISTRICT_CODE: districtCode,
// //         PR_CITY_CODE: cityCodeNum,
// //         PR_FAMILY_NO: familyNo,
// //       },
// //       include: {
// //         Children: true,
// //         Profession: true,
// //         City: true,
// //       },
// //       orderBy: { PR_ID: "asc" },
// //     });

// //     if (!familyMembers.length) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No family members found",
// //       });
// //     }

// //     return res.json({
// //       success: true,
// //       count: familyMembers.length,
// //       data: familyMembers,
// //     });
// //   } catch (error) {
// //     console.error("Family members lookup error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: "Error fetching family members",
// //     });
// //   }
// // };

// // // Export all controller functions
// // // export {
// // //   registerUser,
// // //   LoginUser,
// // //   checkPersonById,
// // //   convertUniqueIdToId,
// // //   getUserByUniqueId,
// // //   getFamiliesByLocation,
// // //   getFamilyMembers
// // // };

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
