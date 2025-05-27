// import { PrismaClient } from "@prisma/client";
// import { error, log } from "console";
// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import axios from "axios";
// import FormData from "form-data";
// import prisma from "../db/prismaClient.js";
// // import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";
// import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";

// const app = express();

// app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     if (!PR_ID)
//       return res
//         .status(400)
//         .json({ message: "PR_ID is required", success: false });

//     const existingProfile = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });
//     if (!existingProfile)
//       return res
//         .status(404)
//         .json({ message: "Profile not found", success: false });

//     const cityCode = Number(req.body.PR_CITY_CODE);
//     if (cityCode) {
//       const cityExists = await prisma.city.findUnique({
//         where: { CITY_ID: cityCode },
//       });
//       if (!cityExists)
//         return res
//           .status(400)
//           .json({ message: "Invalid city code", success: false });
//     }

//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       const filePath = req.file.path;
//       const formData = new FormData();
//       formData.append("image", fs.createReadStream(filePath), {
//         filename: req.file.originalname,
//         contentType: req.file.mimetype,
//       });
//       try {
//         const uploadResponse = await axios.post(
//           process.env.HOSTINGER_UPLOAD_API_URL,
//           formData,
//           { headers: { ...formData.getHeaders() } }
//         );
//         if (uploadResponse.data?.status === "success") {
//           PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
//         }
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Upload failed",
//           error: uploadError.message,
//           success: false,
//         });
//       }
//     }

//     let childrenData = [];
//     if (req.body.Children) {
//       try {
//         childrenData =
//           typeof req.body.Children === "string"
//             ? JSON.parse(req.body.Children)
//             : req.body.Children;
//       } catch {
//         return res
//           .status(400)
//           .json({ message: "Invalid Children data format", success: false });
//       }
//     }

//     if (Array.isArray(childrenData)) {
//       await prisma.$transaction(async (tx) => {
//         const existingChildren = await tx.child.findMany({
//           where: { userId: Number(PR_ID) },
//         });
//         for (const child of childrenData) {
//           if (!child.name || !child.dob) continue;
//           const existingChild = existingChildren.find((c) => c.id === child.id);
//           if (existingChild) {
//             await tx.child.update({
//               where: { id: existingChild.id },
//               data: { name: child.name, dob: new Date(child.dob) },
//             });
//           } else {
//             await tx.child.create({
//               data: {
//                 name: child.name,
//                 dob: new Date(child.dob),
//                 userId: Number(PR_ID),
//               },
//             });
//           }
//         }
//       });
//     }

//     const isCompleted =
//       req.body.PR_FULL_NAME &&
//       req.body.PR_DOB &&
//       req.body.PR_MOBILE_NO &&
//       req.body.PR_PIN_CODE &&
//       req.body.PR_AREA_NAME &&
//       req.body.PR_ADDRESS &&
//       req.body.PR_FATHER_NAME &&
//       req.body.PR_MOTHER_NAME
//         ? "Y"
//         : "N";

//     const updateData = {
//       PR_FULL_NAME: req.body.PR_FULL_NAME,
//       PR_DOB: req.body.PR_DOB,
//       PR_MOBILE_NO: req.body.PR_MOBILE_NO,
//       PR_GENDER: req.body.PR_GENDER,
//       PR_PIN_CODE: req.body.PR_PIN_CODE,
//       PR_AREA_NAME: req.body.PR_AREA_NAME,
//       PR_ADDRESS: req.body.PR_ADDRESS,
//       PR_STATE_CODE: req.body.PR_STATE_CODE,
//       PR_DISTRICT_CODE: req.body.PR_DISTRICT_CODE,
//       PR_EDUCATION: req.body.PR_EDUCATION,
//       PR_EDUCATION_DESC: req.body.PR_EDUCATION_DESC,
//       PR_PROFESSION_DETA: req.body.PR_PROFESSION_DETA,
//       PR_MARRIED_YN: req.body.PR_MARRIED_YN,
//       PR_FATHER_ID: req.body.PR_FATHER_ID,
//       PR_MOTHER_ID: req.body.PR_MOTHER_ID,
//       PR_SPOUSE_ID: req.body.PR_SPOUSE_ID,
//       PR_CITY_CODE: cityCode,
//       PR_FATHER_NAME: req.body.PR_FATHER_NAME,
//       PR_MOTHER_NAME: req.body.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: req.body.PR_SPOUSE_NAME,
//       PR_BUSS_INTER: req.body.PR_BUSS_INTER,
//       PR_BUSS_STREAM: req.body.PR_BUSS_STREAM,
//       PR_BUSS_TYPE: req.body.PR_BUSS_TYPE,
//       PR_HOBBY: req.body.PR_HOBBY,
//       PR_PROFESSION_ID: Number(req.body.PR_PROFESSION_ID),
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL: PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//     };

//     const locationChanged =
//       req.body.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
//       req.body.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
//       req.body.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

//     // Only regenerate PR_UNIQUE_ID if location changed AND profile is not completed
//     if (locationChanged && existingProfile.PR_IS_COMPLETED !== "Y") {
//       const newStateCode =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

//       const prefix = `${newStateCode}${newDistrictCode}-${newCityCode}`;
//       const mobile = existingProfile.PR_MOBILE_NO;

//       const existing = await prisma.$queryRaw`
//         SELECT PR_UNIQUE_ID
//         FROM PEOPLE_REGISTRY
//         WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%')
//         AND PR_MOBILE_NO = ${mobile}
//         LIMIT 1;
//       `;

//       let prUniqueId, familyNumber, memberNumber;

//       if (existing.length > 0) {
//         const memberResult = await prisma.$queryRaw`
//           SELECT
//             SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS family,
//             MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%')
//           AND PR_MOBILE_NO = ${mobile}
//           GROUP BY family;
//         `;

//         familyNumber = memberResult[0].family;
//         const nextMember = Number(memberResult[0].max_member) + 1;
//         memberNumber = String(nextMember).padStart(4, "0");
//         prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
//       } else {
//         const familyResult = await prisma.$queryRaw`
//           SELECT
//             MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS UNSIGNED)) AS max_family
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%');
//         `;

//         const nextFamily = (familyResult[0].max_family || 0) + 1;
//         familyNumber = String(nextFamily).padStart(4, "0");
//         memberNumber = "0001";
//         prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
//       }

//       updateData.PR_UNIQUE_ID = prUniqueId;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = Number(newCityCode);
//       updateData.PR_FAMILY_NO = familyNumber;
//       updateData.PR_MEMBER_NO = memberNumber;
//     } else if (locationChanged && existingProfile.PR_IS_COMPLETED === "Y") {
//       // If profile is completed, only update the location fields but keep existing PR_UNIQUE_ID
//       updateData.PR_STATE_CODE =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       updateData.PR_DISTRICT_CODE =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       updateData.PR_CITY_CODE =
//         Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;

//       // Keep existing unique ID and family/member numbers
//       // Don't update PR_UNIQUE_ID, PR_FAMILY_NO, PR_MEMBER_NO
//     }

//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: updateData,
//     });

//     return res
//       .status(200)
//       .json({ message: "Profile updated", updatedProfile, success: true });
//   } catch (error) {
//     console.error("Profile update failed:", error);
//     return res.status(500).json({
//       message: error.message || "Internal server error",
//       success: false,
//     });
//   }
// }

// export default EditProfile;
////////////////////////////////////////////////////////////////
// import { PrismaClient } from "@prisma/client";
// import { error, log } from "console";
// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import axios from "axios";
// import FormData from "form-data";
// import prisma from "../db/prismaClient.js";
// // import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";
// import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";

// const app = express();

// app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     if (!PR_ID)
//       return res
//         .status(400)
//         .json({ message: "PR_ID is required", success: false });

//     const existingProfile = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });
//     if (!existingProfile)
//       return res
//         .status(404)
//         .json({ message: "Profile not found", success: false });

//     const cityCode = Number(req.body.PR_CITY_CODE);
//     if (cityCode) {
//       const cityExists = await prisma.city.findUnique({
//         where: { CITY_ID: cityCode },
//       });
//       if (!cityExists)
//         return res
//           .status(400)
//           .json({ message: "Invalid city code", success: false });
//     }

//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       const filePath = req.file.path;
//       const formData = new FormData();
//       formData.append("image", fs.createReadStream(filePath), {
//         filename: req.file.originalname,
//         contentType: req.file.mimetype,
//       });
//       try {
//         const uploadResponse = await axios.post(
//           process.env.HOSTINGER_UPLOAD_API_URL,
//           formData,
//           { headers: { ...formData.getHeaders() } }
//         );
//         if (uploadResponse.data?.status === "success") {
//           PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
//         }
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Upload failed",
//           error: uploadError.message,
//           success: false,
//         });
//       }
//     }

//     let childrenData = [];
//     if (req.body.Children) {
//       try {
//         childrenData =
//           typeof req.body.Children === "string"
//             ? JSON.parse(req.body.Children)
//             : req.body.Children;
//       } catch {
//         return res
//           .status(400)
//           .json({ message: "Invalid Children data format", success: false });
//       }
//     }

//     if (Array.isArray(childrenData)) {
//       await prisma.$transaction(async (tx) => {
//         const existingChildren = await tx.child.findMany({
//           where: { userId: Number(PR_ID) },
//         });
//         for (const child of childrenData) {
//           if (!child.name || !child.dob) continue;
//           const existingChild = existingChildren.find((c) => c.id === child.id);
//           if (existingChild) {
//             await tx.child.update({
//               where: { id: existingChild.id },
//               data: { name: child.name, dob: new Date(child.dob) },
//             });
//           } else {
//             await tx.child.create({
//               data: {
//                 name: child.name,
//                 dob: new Date(child.dob),
//                 userId: Number(PR_ID),
//               },
//             });
//           }
//         }
//       });
//     }

//     const isCompleted =
//       req.body.PR_FULL_NAME &&
//       req.body.PR_DOB &&
//       req.body.PR_MOBILE_NO &&
//       req.body.PR_PIN_CODE &&
//       req.body.PR_AREA_NAME &&
//       req.body.PR_ADDRESS &&
//       req.body.PR_FATHER_NAME &&
//       req.body.PR_MOTHER_NAME
//         ? "Y"
//         : "N";

//     const updateData = {
//       PR_FULL_NAME: req.body.PR_FULL_NAME,
//       PR_DOB: req.body.PR_DOB,
//       PR_MOBILE_NO: req.body.PR_MOBILE_NO,
//       PR_GENDER: req.body.PR_GENDER,
//       PR_PIN_CODE: req.body.PR_PIN_CODE,
//       PR_AREA_NAME: req.body.PR_AREA_NAME,
//       PR_ADDRESS: req.body.PR_ADDRESS,
//       PR_STATE_CODE: req.body.PR_STATE_CODE,
//       PR_DISTRICT_CODE: req.body.PR_DISTRICT_CODE,
//       PR_EDUCATION: req.body.PR_EDUCATION,
//       PR_EDUCATION_DESC: req.body.PR_EDUCATION_DESC,
//       PR_PROFESSION_DETA: req.body.PR_PROFESSION_DETA,
//       PR_MARRIED_YN: req.body.PR_MARRIED_YN,
//       PR_FATHER_ID: req.body.PR_FATHER_ID,
//       PR_MOTHER_ID: req.body.PR_MOTHER_ID,
//       PR_SPOUSE_ID: req.body.PR_SPOUSE_ID,
//       PR_CITY_CODE: cityCode,
//       PR_FATHER_NAME: req.body.PR_FATHER_NAME,
//       PR_MOTHER_NAME: req.body.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: req.body.PR_SPOUSE_NAME,
//       PR_BUSS_INTER: req.body.PR_BUSS_INTER,
//       PR_BUSS_STREAM: req.body.PR_BUSS_STREAM,
//       PR_BUSS_TYPE: req.body.PR_BUSS_TYPE,
//       PR_HOBBY: req.body.PR_HOBBY,
//       PR_PROFESSION_ID: Number(req.body.PR_PROFESSION_ID),
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL: PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//     };

//     const locationChanged =
//       req.body.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
//       req.body.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
//       req.body.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

//     // Only regenerate PR_UNIQUE_ID if location changed AND profile is not completed
//     if (locationChanged && existingProfile.PR_IS_COMPLETED !== "Y") {
//       const newStateCode =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

//       const prefix = `${newStateCode}${newDistrictCode}-${newCityCode}`;
//       const mobile = existingProfile.PR_MOBILE_NO;

//       // Fix collation issue by using COLLATE clause
//       const existing = await prisma.$queryRaw`
//         SELECT PR_UNIQUE_ID
//         FROM PEOPLE_REGISTRY
//         WHERE PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
//         AND PR_MOBILE_NO = ${mobile}
//         LIMIT 1;
//       `;

//       let prUniqueId, familyNumber, memberNumber;

//       if (existing.length > 0) {
//         const memberResult = await prisma.$queryRaw`
//           SELECT
//             SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS family,
//             MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
//           AND PR_MOBILE_NO = ${mobile}
//           GROUP BY family;
//         `;

//         familyNumber = memberResult[0].family;
//         const nextMember = Number(memberResult[0].max_member) + 1;
//         memberNumber = String(nextMember).padStart(4, "0");
//         prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
//       } else {
//         const familyResult = await prisma.$queryRaw`
//           SELECT
//             MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS UNSIGNED)) AS max_family
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci;
//         `;

//         const nextFamily = (familyResult[0].max_family || 0) + 1;
//         familyNumber = String(nextFamily).padStart(4, "0");
//         memberNumber = "0001";
//         prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
//       }

//       updateData.PR_UNIQUE_ID = prUniqueId;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = Number(newCityCode);
//       updateData.PR_FAMILY_NO = familyNumber;
//       updateData.PR_MEMBER_NO = memberNumber;
//     } else if (locationChanged && existingProfile.PR_IS_COMPLETED === "Y") {
//       // If profile is completed, only update the location fields but keep existing PR_UNIQUE_ID
//       updateData.PR_STATE_CODE =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       updateData.PR_DISTRICT_CODE =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       updateData.PR_CITY_CODE =
//         Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;

//       // Keep existing unique ID and family/member numbers
//       // Don't update PR_UNIQUE_ID, PR_FAMILY_NO, PR_MEMBER_NO
//     }

//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: updateData,
//     });

//     return res
//       .status(200)
//       .json({ message: "Profile updated", updatedProfile, success: true });
//   } catch (error) {
//     console.error("Profile update failed:", error);
//     return res.status(500).json({
//       message: error.message || "Internal server error",
//       success: false,
//     });
//   }
// }

// export default EditProfile;
///////////////////////////////////////////////////////////////////////////////////////////////

// import { PrismaClient } from "@prisma/client";
// import { error, log } from "console";
// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import axios from "axios";
// import FormData from "form-data";
// import prisma from "../db/prismaClient.js";
// import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";

// const app = express();

// app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     if (!PR_ID)
//       return res
//         .status(400)
//         .json({ message: "PR_ID is required", success: false });

//     const existingProfile = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });
//     if (!existingProfile)
//       return res
//         .status(404)
//         .json({ message: "Profile not found", success: false });

//     const cityCode = Number(req.body.PR_CITY_CODE);
//     if (cityCode) {
//       const cityExists = await prisma.city.findUnique({
//         where: { CITY_ID: cityCode },
//       });
//       if (!cityExists)
//         return res
//           .status(400)
//           .json({ message: "Invalid city code", success: false });
//     }

//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       const filePath = req.file.path;
//       const formData = new FormData();
//       formData.append("image", fs.createReadStream(filePath), {
//         filename: req.file.originalname,
//         contentType: req.file.mimetype,
//       });
//       try {
//         const uploadResponse = await axios.post(
//           process.env.HOSTINGER_UPLOAD_API_URL,
//           formData,
//           { headers: { ...formData.getHeaders() } }
//         );
//         if (uploadResponse.data?.status === "success") {
//           PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
//         }
//       } catch (uploadError) {
//         return res.status(500).json({
//           message: "Upload failed",
//           error: uploadError.message,
//           success: false,
//         });
//       }
//     }

//     let childrenData = [];
//     if (req.body.Children) {
//       try {
//         childrenData =
//           typeof req.body.Children === "string"
//             ? JSON.parse(req.body.Children)
//             : req.body.Children;
//       } catch {
//         return res
//           .status(400)
//           .json({ message: "Invalid Children data format", success: false });
//       }
//     }

//     if (Array.isArray(childrenData)) {
//       await prisma.$transaction(async (tx) => {
//         const existingChildren = await tx.child.findMany({
//           where: { userId: Number(PR_ID) },
//         });
//         for (const child of childrenData) {
//           if (!child.name || !child.dob) continue;
//           const existingChild = existingChildren.find((c) => c.id === child.id);
//           if (existingChild) {
//             await tx.child.update({
//               where: { id: existingChild.id },
//               data: { name: child.name, dob: new Date(child.dob) },
//             });
//           } else {
//             await tx.child.create({
//               data: {
//                 name: child.name,
//                 dob: new Date(child.dob),
//                 userId: Number(PR_ID),
//               },
//             });
//           }
//         }
//       });
//     }

//     const isCompleted =
//       req.body.PR_FULL_NAME &&
//       req.body.PR_DOB &&
//       req.body.PR_MOBILE_NO &&
//       req.body.PR_PIN_CODE &&
//       req.body.PR_AREA_NAME &&
//       req.body.PR_ADDRESS &&
//       req.body.PR_FATHER_NAME &&
//       req.body.PR_MOTHER_NAME
//         ? "Y"
//         : "N";

//     const updateData = {
//       PR_FULL_NAME: req.body.PR_FULL_NAME,
//       PR_DOB: req.body.PR_DOB,
//       PR_MOBILE_NO: req.body.PR_MOBILE_NO,
//       PR_GENDER: req.body.PR_GENDER,
//       PR_PIN_CODE: req.body.PR_PIN_CODE,
//       PR_AREA_NAME: req.body.PR_AREA_NAME,
//       PR_ADDRESS: req.body.PR_ADDRESS,
//       PR_STATE_CODE: req.body.PR_STATE_CODE,
//       PR_DISTRICT_CODE: req.body.PR_DISTRICT_CODE,
//       PR_EDUCATION: req.body.PR_EDUCATION,
//       PR_EDUCATION_DESC: req.body.PR_EDUCATION_DESC,
//       PR_PROFESSION_DETA: req.body.PR_PROFESSION_DETA,
//       PR_MARRIED_YN: req.body.PR_MARRIED_YN,
//       PR_FATHER_ID: req.body.PR_FATHER_ID,
//       PR_MOTHER_ID: req.body.PR_MOTHER_ID,
//       PR_SPOUSE_ID: req.body.PR_SPOUSE_ID,
//       PR_CITY_CODE: cityCode,
//       PR_FATHER_NAME: req.body.PR_FATHER_NAME,
//       PR_MOTHER_NAME: req.body.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: req.body.PR_SPOUSE_NAME,
//       PR_BUSS_INTER: req.body.PR_BUSS_INTER,
//       PR_BUSS_STREAM: req.body.PR_BUSS_STREAM,
//       PR_BUSS_TYPE: req.body.PR_BUSS_TYPE,
//       PR_HOBBY: req.body.PR_HOBBY,
//       PR_PROFESSION_ID: Number(req.body.PR_PROFESSION_ID),
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL: PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//     };

//     const locationChanged =
//       req.body.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
//       req.body.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
//       req.body.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

//     // Only regenerate PR_UNIQUE_ID if location changed AND profile is not completed
//     if (locationChanged && existingProfile.PR_IS_COMPLETED !== "Y") {
//       const newStateCode =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

//       const prefix = `${newStateCode}${newDistrictCode}-${newCityCode}`;
//       const mobile = existingProfile.PR_MOBILE_NO;

//       // Fix collation issue by using COLLATE clause
//       const existing = await prisma.$queryRaw`
//           SELECT PR_UNIQUE_ID
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
//           AND PR_MOBILE_NO = ${mobile}
//           LIMIT 1;
//       `;

//       let prUniqueId, familyNumber, memberNumber;

//       if (existing.length > 0) {
//         const memberResult = await prisma.$queryRaw`
//           SELECT
//             SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS family,
//             MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
//           AND PR_MOBILE_NO = ${mobile}
//           GROUP BY family;
//         `;

//         familyNumber = memberResult[0].family;
//         // Convert BigInt to Number for arithmetic operations
//         const maxMember =
//           typeof memberResult[0].max_member === "bigint"
//             ? Number(memberResult[0].max_member)
//             : memberResult[0].max_member;
//         const nextMember = maxMember + 1;
//         memberNumber = String(nextMember).padStart(4, "0");
//         prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
//       } else {
//         // const familyResult = await prisma.$queryRaw`
//         //   -- SELECT
//         //   --   MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS UNSIGNED)) AS max_family
//         //   -- FROM PEOPLE_REGISTRY
//         //   -- WHERE PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci;

//         //   SELECT COUNT(DISTINCT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3)) AS unique_family_count FROM PEOPLE_REGISTRY WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%');

//         // `;
//         const familyResult = await prisma.$queryRaw(
//           `SELECT COUNT(DISTINCT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3)) AS unique_family_count
//    FROM PEOPLE_REGISTRY
//    WHERE PR_UNIQUE_ID LIKE CONCAT(?, '-%')`,
//           prefix
//         );

//         // Convert BigInt to Number for arithmetic operations
//         const maxFamily =
//           typeof familyResult[0].max_family === "bigint"
//             ? Number(familyResult[0].max_family)
//             : familyResult[0].max_family;
//         const nextFamily = (maxFamily || 0) + 1;
//         familyNumber = String(nextFamily).padStart(4, "0");
//         memberNumber = "0001";
//         prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
//       }

//       updateData.PR_UNIQUE_ID = prUniqueId;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = Number(newCityCode);
//       updateData.PR_FAMILY_NO = familyNumber;
//       updateData.PR_MEMBER_NO = memberNumber;
//     } else if (locationChanged && existingProfile.PR_IS_COMPLETED === "Y") {
//       // If profile is completed, only update the location fields but keep existing PR_UNIQUE_ID
//       updateData.PR_STATE_CODE =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       updateData.PR_DISTRICT_CODE =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       updateData.PR_CITY_CODE =
//         Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;

//       // Keep existing unique ID and family/member numbers
//       // Don't update PR_UNIQUE_ID, PR_FAMILY_NO, PR_MEMBER_NO
//     }

//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: updateData,
//     });

//     return res
//       .status(200)
//       .json({ message: "Profile updated", updatedProfile, success: true });
//   } catch (error) {
//     console.error("Profile update failed:", error);
//     return res.status(500).json({
//       message: error.message || "Internal server error",
//       success: false,
//     });
//   }
// }

// export default EditProfile;

import { PrismaClient } from "@prisma/client";
import express from "express";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import prisma from "../db/prismaClient.js";

const app = express();
app.use(express.json());

async function EditProfile(req, res) {
  try {
    const PR_ID = req.headers.pr_id;
    if (!PR_ID)
      return res
        .status(400)
        .json({ message: "PR_ID is required", success: false });

    const existingProfile = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: Number(PR_ID) },
    });
    if (!existingProfile)
      return res
        .status(404)
        .json({ message: "Profile not found", success: false });

    // Validate city code
    const cityCode = Number(req.body.PR_CITY_CODE);
    if (cityCode) {
      const cityExists = await prisma.city.findUnique({
        where: { CITY_ID: cityCode },
      });
      if (!cityExists)
        return res
          .status(400)
          .json({ message: "Invalid city code", success: false });
    }

    // Handle photo upload
    let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
    if (req.file) {
      const formData = new FormData();
      formData.append("image", fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      try {
        const uploadResponse = await axios.post(
          process.env.HOSTINGER_UPLOAD_API_URL,
          formData,
          { headers: formData.getHeaders() }
        );
        if (uploadResponse.data?.status === "success") {
          PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
        }
      } catch (uploadError) {
        return res.status(500).json({
          message: "Upload failed",
          error: uploadError.message,
          success: false,
        });
      }
    }

    // Process children data
    let childrenData = [];
    if (req.body.Children) {
      try {
        childrenData =
          typeof req.body.Children === "string"
            ? JSON.parse(req.body.Children)
            : req.body.Children;
      } catch {
        return res
          .status(400)
          .json({ message: "Invalid Children data format", success: false });
      }
    }

    // if (Array.isArray(childrenData)) {
    //   await prisma.$transaction(async (tx) => {
    //     const existingChildren = await tx.child.findMany({
    //       where: { userId: Number(PR_ID) },
    //     });

    //     for (const child of childrenData) {
    //       if (!child.name || !child.dob) continue;

    //       if (child.id) {
    //         await tx.child.update({
    //           where: { id: child.id },
    //           data: { name: child.name, dob: new Date(child.dob) },
    //         });
    //       } else {
    //         await tx.child.create({
    //           data: {
    //             name: child.name,
    //             dob: new Date(child.dob),
    //             userId: Number(PR_ID),
    //           },
    //         });
    //       }
    //     }
    //   });
    // }

    // Determine profile completion status

    if (Array.isArray(childrenData)) {
      await prisma.$transaction(async (tx) => {
        const existingChildren = await tx.child.findMany({
          where: { userId: Number(PR_ID) },
        });

        for (const child of childrenData) {
          if (!child.name || !child.dob) continue;

          if (child.id) {
            // First check if the child exists
            const childExists = existingChildren.some((c) => c.id === child.id);
            if (childExists) {
              await tx.child.update({
                where: { id: child.id },
                data: { name: child.name, dob: new Date(child.dob) },
              });
            } else {
              // If child with this ID doesn't exist, create a new one
              await tx.child.create({
                data: {
                  name: child.name,
                  dob: new Date(child.dob),
                  userId: Number(PR_ID),
                },
              });
            }
          } else {
            await tx.child.create({
              data: {
                name: child.name,
                dob: new Date(child.dob),
                userId: Number(PR_ID),
              },
            });
          }
        }
      });
    }

    const isCompleted = [
      "PR_FULL_NAME",
      "PR_DOB",
      "PR_MOBILE_NO",
      "PR_PIN_CODE",
      "PR_AREA_NAME",
      "PR_ADDRESS",
      "PR_FATHER_NAME",
      "PR_MOTHER_NAME",
    ].every((field) => req.body[field])
      ? "Y"
      : "N";

    const convertEmptyToNull = (value) => {
      if (value === "" || value === undefined) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      return value;
    };

    // Helper function to convert to number or null
    const convertToNumberOrNull = (value) => {
      if (value === "" || value === undefined || value === null) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const updateData = {
      PR_PR_ID: convertToNumberOrNull(req.body.PR_PR_ID),
      PR_FULL_NAME: req.body.PR_FULL_NAME,
      PR_DOB: req.body.PR_DOB,
      PR_MOBILE_NO: req.body.PR_MOBILE_NO,
      PR_GENDER: req.body.PR_GENDER,
      PR_PIN_CODE: req.body.PR_PIN_CODE,
      PR_AREA_NAME: req.body.PR_AREA_NAME,
      PR_ADDRESS: req.body.PR_ADDRESS,
      PR_STATE_CODE: req.body.PR_STATE_CODE,
      PR_DISTRICT_CODE: req.body.PR_DISTRICT_CODE,
      PR_EDUCATION: req.body.PR_EDUCATION,
      PR_EDUCATION_DESC: req.body.PR_EDUCATION_DESC,
      PR_PROFESSION_DETA: req.body.PR_PROFESSION_DETA,
      PR_MARRIED_YN: req.body.PR_MARRIED_YN,
      PR_FATHER_NAME: req.body.PR_FATHER_NAME,
      PR_MOTHER_NAME: req.body.PR_MOTHER_NAME,
      PR_SPOUSE_NAME: req.body.PR_SPOUSE_NAME,
      PR_BUSS_INTER: req.body.PR_BUSS_INTER,
      PR_BUSS_STREAM: req.body.PR_BUSS_STREAM,
      PR_BUSS_TYPE: req.body.PR_BUSS_TYPE,
      PR_HOBBY: req.body.PR_HOBBY,
      // Convert integer fields properly - handle empty strings
      PR_FATHER_ID: convertToNumberOrNull(req.body.PR_FATHER_ID),
      PR_MOTHER_ID: convertToNumberOrNull(req.body.PR_MOTHER_ID),
      PR_SPOUSE_ID: convertToNumberOrNull(req.body.PR_SPOUSE_ID),
      PR_PROFESSION_ID: convertToNumberOrNull(req.body.PR_PROFESSION_ID),
      PR_CITY_CODE: cityCode || null,
      PR_UPDATED_AT: new Date(),
      PR_PHOTO_URL,
      PR_IS_COMPLETED: isCompleted,
    };

    // Handle location changes and unique ID generation
    const locationChanged = [
      "PR_STATE_CODE",
      "PR_DISTRICT_CODE",
      "PR_CITY_CODE",
    ].some((field) => req.body[field] !== existingProfile[field]);

    if (locationChanged && existingProfile.PR_IS_COMPLETED !== "Y") {
      const newStateCode =
        req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
      const newDistrictCode =
        req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
      const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;
      const prefix = `${newStateCode}${newDistrictCode}-${newCityCode}`;

      // Check existing records with same prefix and mobile
      const existing = await prisma.$queryRaw`
        SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
        WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
        AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
        LIMIT 1
      `;

      let prUniqueId, familyNumber, memberNumber;

      if (existing.length > 0) {
        // Get max member number in existing family
        const memberResult = await prisma.$queryRaw`
          SELECT 
            SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS family,
            MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
          FROM PEOPLE_REGISTRY
          WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
          AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
          GROUP BY family
        `;

        familyNumber = memberResult[0].family;
        const nextMember = Number(memberResult[0].max_member) + 1;
        memberNumber = String(nextMember).padStart(4, "0");
      } else {
        // Get next available family number - Fixed query
        const familyResult = await prisma.$queryRaw`
          SELECT MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS UNSIGNED)) AS max_family 
          FROM PEOPLE_REGISTRY
          WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
        `;

        const nextFamily = (Number(familyResult[0]?.max_family) || 0) + 1;
        familyNumber = String(nextFamily).padStart(4, "0");
        memberNumber = "0001";
      }

      prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;

      Object.assign(updateData, {
        PR_UNIQUE_ID: prUniqueId,
        PR_STATE_CODE: newStateCode,
        PR_DISTRICT_CODE: newDistrictCode,
        PR_CITY_CODE: Number(newCityCode),
        PR_FAMILY_NO: familyNumber,
        PR_MEMBER_NO: memberNumber,
      });
    } else if (locationChanged) {
      updateData.PR_STATE_CODE =
        req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
      updateData.PR_DISTRICT_CODE =
        req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
      updateData.PR_CITY_CODE =
        Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;
    }

    // Update profile
    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: updateData,
    });

    return res
      .status(200)
      .json({ message: "Profile updated", updatedProfile, success: true });
  } catch (error) {
    console.error("Profile update failed:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
}

export default EditProfile;
