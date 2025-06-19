// import { PrismaClient } from "@prisma/client";
// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import axios from "axios";
// import FormData from "form-data";
// import prisma from "../db/prismaClient.js";

// const app = express();
// app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     const { PR_FCM_TOKEN } = req.body;
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

//     // Validate city code
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

//     // Handle photo upload
//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       const formData = new FormData();
//       formData.append("image", fs.createReadStream(req.file.path), {
//         filename: req.file.originalname,
//         contentType: req.file.mimetype,
//       });

//       try {
//         const uploadResponse = await axios.post(
//           process.env.HOSTINGER_UPLOAD_API_URL,
//           formData,
//           { headers: formData.getHeaders() }
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

//     // Process children data
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

//           if (child.id) {
//             // First check if the child exists
//             const childExists = existingChildren.some((c) => c.id === child.id);
//             if (childExists) {
//               await tx.child.update({
//                 where: { id: child.id },
//                 data: { name: child.name, dob: new Date(child.dob) },
//               });
//             } else {
//               // If child with this ID doesn't exist, create a new one
//               await tx.child.create({
//                 data: {
//                   name: child.name,
//                   dob: new Date(child.dob),
//                   userId: Number(PR_ID),
//                 },
//               });
//             }
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

//     const isCompleted = [
//       "PR_FULL_NAME",
//       "PR_DOB",
//       "PR_MOBILE_NO",
//       "PR_PIN_CODE",
//       "PR_AREA_NAME",
//       "PR_ADDRESS",
//       "PR_FATHER_NAME",
//       "PR_MOTHER_NAME",
//     ].every((field) => req.body[field])
//       ? "Y"
//       : "N";

//     const convertEmptyToNull = (value) => {
//       if (value === "" || value === undefined) return null;
//       if (typeof value === "string" && value.trim() === "") return null;
//       return value;
//     };

//     // Helper function to convert to number or null
//     const convertToNumberOrNull = (value) => {
//       if (value === "" || value === undefined || value === null) return null;
//       if (typeof value === "string" && value.trim() === "") return null;
//       const num = Number(value);
//       return isNaN(num) ? null : num;
//     };

//     const updateData = {
//       PR_PR_ID: convertToNumberOrNull(req.body.PR_PR_ID),
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
//       PR_FATHER_NAME: req.body.PR_FATHER_NAME,
//       PR_MOTHER_NAME: req.body.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: req.body.PR_SPOUSE_NAME,
//       PR_BUSS_INTER: req.body.PR_BUSS_INTER,
//       PR_BUSS_STREAM: req.body.PR_BUSS_STREAM,
//       PR_BUSS_TYPE: req.body.PR_BUSS_TYPE,
//       PR_HOBBY: req.body.PR_HOBBY,
//       // Convert integer fields properly - handle empty strings
//       PR_FATHER_ID: convertToNumberOrNull(req.body.PR_FATHER_ID),
//       PR_MOTHER_ID: convertToNumberOrNull(req.body.PR_MOTHER_ID),
//       PR_SPOUSE_ID: convertToNumberOrNull(req.body.PR_SPOUSE_ID),
//       PR_PROFESSION_ID: convertToNumberOrNull(req.body.PR_PROFESSION_ID),
//       PR_CITY_CODE: cityCode || null,
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//       ...(PR_FCM_TOKEN && { PR_FCM_TOKEN }),
//     };

//     // Handle location changes and unique ID generation
//     const locationChanged = [
//       "PR_STATE_CODE",
//       "PR_DISTRICT_CODE",
//       "PR_CITY_CODE",
//     ].some((field) => req.body[field] !== existingProfile[field]);

//     if (locationChanged && existingProfile.PR_IS_COMPLETED !== "Y") {
//       const newStateCode =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;
//       const prefix = `${newStateCode}${newDistrictCode}-${newCityCode}`;

//       // Check existing records with same prefix and mobile
//       const existing = await prisma.$queryRaw`
//         SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
//         WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
//         AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
//         LIMIT 1
//       `;

//       let prUniqueId, familyNumber, memberNumber;

//       if (existing.length > 0) {
//         // Get max member number in existing family
//         const memberResult = await prisma.$queryRaw`
//           SELECT
//             SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS family,
//             MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
//           AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
//           GROUP BY family
//         `;

//         familyNumber = memberResult[0].family;
//         const nextMember = Number(memberResult[0].max_member) + 1;
//         memberNumber = String(nextMember).padStart(4, "0");
//       } else {
//         // Get next available family number - Fixed query
//         const familyResult = await prisma.$queryRaw`
//           SELECT MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS UNSIGNED)) AS max_family
//           FROM PEOPLE_REGISTRY
//           WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
//         `;

//         const nextFamily = (Number(familyResult[0]?.max_family) || 0) + 1;
//         familyNumber = String(nextFamily).padStart(4, "0");
//         memberNumber = "0001";
//       }

//       prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;

//       Object.assign(updateData, {
//         PR_UNIQUE_ID: prUniqueId,
//         PR_STATE_CODE: newStateCode,
//         PR_DISTRICT_CODE: newDistrictCode,
//         PR_CITY_CODE: Number(newCityCode),
//         PR_FAMILY_NO: familyNumber,
//         PR_MEMBER_NO: memberNumber,
//       });
//     } else if (locationChanged) {
//       updateData.PR_STATE_CODE =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       updateData.PR_DISTRICT_CODE =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       updateData.PR_CITY_CODE =
//         Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;
//     }

//     // Update profile
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

    // Validate father and mother gender

    if (req.body.PR_FATHER_ID) {
      const father = await prisma.peopleRegistry.findUnique({
        where: { PR_ID: Number(req.body.PR_FATHER_ID) },
        select: { PR_GENDER: true },
      });
      if (!father || father.PR_GENDER?.toUpperCase() !== "M") {
        return res.status(400).json({
          message: "Father ID must refer to a Male (gender 'M')",
          success: false,
        });
      }
    }

    if (req.body.PR_MOTHER_ID) {
      const mother = await prisma.peopleRegistry.findUnique({
        where: { PR_ID: Number(req.body.PR_MOTHER_ID) },
        select: { PR_GENDER: true },
      });
      if (!mother || mother.PR_GENDER?.toUpperCase() !== "F") {
        return res.status(400).json({
          message: "Mother ID must refer to a Female (gender 'F')",
          success: false,
        });
      }
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
      PR_BUSS_CODE: req.body.PR_BUSS_CODE,
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

      const fatherPrID = req.body.PR_FATHER_ID || existingProfile.PR_FATHER_ID;
      const motherPrID = req.body.PR_MOTHER_ID || existingProfile.PR_MOTHER_ID;
      let query;
      let memberResult;
      let existing;

      if (fatherPrID || motherPrID) {
        const parentId = fatherPrID || motherPrID;

        // First, get the parent's PR_UNIQUE_ID
        query = prisma.$queryRaw`
    SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
    WHERE PR_ID = ${parentId}
    LIMIT 1
  `;
        existing = await query;

        if (existing && existing.length > 0) {
          // Extract parent's location prefix (first 3 parts: state-district-city)
          const parentUniqueId = existing[0].PR_UNIQUE_ID;
          const parentLocationPrefix = parentUniqueId
            .split("-")
            .slice(0, 3)
            .join("-"); // e.g., "0806-12-0001"
          const parentPrefix = parentUniqueId.split("-").slice(0, 2).join("-"); // e.g., "0806-12"

          console.log("Parent location prefix:", parentLocationPrefix);
          console.log("New location prefix:", prefix);

          // Check if parent's location matches new location
          if (parentPrefix === prefix) {
            // Same location - use parent's family pattern
            console.log(
              "Using parent location",
              `SELECT
          SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
          MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
        FROM PEOPLE_REGISTRY
        WHERE PR_UNIQUE_ID LIKE CONCAT(${parentLocationPrefix}, '-%') COLLATE utf8mb4_unicode_ci
        GROUP BY family`
            );

            memberResult = await prisma.$queryRaw`
        SELECT
          SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
          MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
        FROM PEOPLE_REGISTRY
        WHERE PR_UNIQUE_ID LIKE CONCAT(${parentLocationPrefix}, '-%') COLLATE utf8mb4_unicode_ci
        GROUP BY family
      `;

            console.log(
              "Using parent location - same location as new profile",
              `
        SELECT
          SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
          MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
        FROM PEOPLE_REGISTRY
        WHERE PR_UNIQUE_ID LIKE CONCAT(${parentLocationPrefix}, '-%') COLLATE utf8mb4_unicode_ci
        GROUP BY family
      `
            );
          } else {
            // Different location - use mobile number query with new prefix
            console.log(
              "Using mobile number query ",
              `
        SELECT
          SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
          MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
        FROM PEOPLE_REGISTRY
        WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
        AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
        GROUP BY family
      `
            );
            memberResult = await prisma.$queryRaw`
        SELECT
          SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
          MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
        FROM PEOPLE_REGISTRY
        WHERE  PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    AND PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
        GROUP BY family
      `;

            console.log(
              "Using mobile number query - different location from parent",
              `
        SELECT
          SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
          MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
        FROM PEOPLE_REGISTRY
        WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
        AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
        GROUP BY family
      `
            );
          }
        } else {
          console.log(
            "Parent not found",
            `
      SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
        MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
      FROM PEOPLE_REGISTRY
      WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
      AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
      GROUP BY family
    `
          );
          // Parent not found - fallback to mobile number query
          memberResult = await prisma.$queryRaw`
      SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
        MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
      FROM PEOPLE_REGISTRY
      WHERE  PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    AND PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
      GROUP BY family
    `;

          console.log(
            "Parent not found - using mobile number query",
            `
      SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
        MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
      FROM PEOPLE_REGISTRY
      WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
      AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
      GROUP BY family
    `
          );
        }
      } else {
        // No parent IDs - use mobile number query
        console.log(
          "No parent IDs",
          `
    SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
    WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
    AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    LIMIT 1
  `
        );
        query = prisma.$queryRaw`
    SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
    WHERE  PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    AND PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
    LIMIT 1
  `;
        existing = await query;

        console.log("Existing records found:", existing);
        console.log(
          "Using mobile number query for family and member numbers",
          `
   SELECT
      SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
      MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
    FROM PEOPLE_REGISTRY
    WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
    AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    GROUP BY family
  `
        );

        memberResult = await prisma.$queryRaw`
    SELECT
      SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
      MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
    FROM PEOPLE_REGISTRY
    WHERE  PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    AND PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
    GROUP BY family
  `;

        console.log(
          "No parent IDs - using mobile number query",
          `SELECT
      SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', 3), '-', -1) AS family,
      MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID COLLATE utf8mb4_unicode_ci, '-', -1) AS UNSIGNED)) AS max_member
    FROM PEOPLE_REGISTRY
    WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_unicode_ci
    AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}
    GROUP BY family`
        );
      }

      console.log("Final memberResult:", memberResult);
      // let andCondition = `PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%')
      //   AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}`;
      // let mobileNo = `AND PR_MOBILE_NO = ${existingProfile.PR_MOBILE_NO}`;
      // if (fatherPrID || motherPrID) {
      //   if (fatherPrID && motherPrID) {
      //     andCondition = ` PR_ID = ${fatherPrID}`;
      //   } else if (fatherPrID) {
      //     andCondition = ` PR_ID = ${fatherPrID}`;
      //   } else if (motherPrID) {
      //     andCondition = ` PR_ID = ${motherPrID}`;
      //   }
      //   mobileNo = "";
      // }

      // // Check existing records with same prefix and mobile
      // const existing = await prisma.$queryRaw`
      //   SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
      //   WHERE ${andCondition} COLLATE utf8mb4_bin
      //   LIMIT 1
      // `;
      // console.log(
      //   "Existing records found:",
      //   existing,
      //   `SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
      //   WHERE ${andCondition} COLLATE utf8mb4_bin
      //   LIMIT 1`
      // );
      console.log(
        "Existing records found:",
        existing,
        `SELECT PR_UNIQUE_ID FROM PEOPLE_REGISTRY
        LIMIT 1`
      );

      let prUniqueId, familyNumber, memberNumber;

      if (existing.length > 0) {
        // Get max member number in existing family
        // const memberResult = await prisma.$queryRaw`
        //   SELECT
        //     SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS family,
        //     MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
        //   FROM PEOPLE_REGISTRY
        //   WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
        //   ${mobileNo}
        //   GROUP BY family
        // `;

        // console.log(
        //   "Member result:",
        //   memberResult,
        //   `
        //   SELECT
        //     SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS family,
        //     MAX(CAST(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', -1) AS UNSIGNED)) AS max_member
        //   FROM PEOPLE_REGISTRY
        //   WHERE PR_UNIQUE_ID LIKE CONCAT(SUBSTRING_INDEX(${prefix}, '-', 3), '-%')
        //   GROUP BY family
        // `
        // );

        familyNumber = memberResult[0]?.family || "0001"; // Default to "0001" if no family found
        const nextMember = Number(memberResult[0]?.max_member || 0) + 1;
        memberNumber = String(nextMember).padStart(4, "0");
      } else {
        // Get next available family number - Fixed query
        const familyResult = await prisma.$queryRaw`
          SELECT MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS UNSIGNED)) AS max_family
          FROM PEOPLE_REGISTRY
          WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
        `;

        console.log(
          "Family result:",
          familyResult,
          `
          SELECT MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1) AS UNSIGNED)) AS max_family
          FROM PEOPLE_REGISTRY
          WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%') COLLATE utf8mb4_bin
        `
        );

        const nextFamily = (Number(familyResult[0]?.max_family) || 0) + 1;
        familyNumber = String(nextFamily).padStart(4, "0");
        memberNumber = "0001";
      }

      prUniqueId = `${prefix}-${familyNumber}-${memberNumber}`;
      console.log("uNIQUE iD:", prUniqueId);
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
