// import { PrismaClient } from "@prisma/client";
// import { error, log } from "console";
// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import axios from "axios";
// import FormData from "form-data";
// import prisma from "../db/prismaClient.js";

// const app = express();
// // const prisma = new PrismaClient();

// app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     if (!PR_ID) {
//       return res.status(400).json({
//         message: "PR_ID is required for updating profile",
//         success: false,
//       });
//     }

//     console.log("Received PR_ID:", PR_ID);
//     console.log("Request Body:", req.body);

//     const existingProfile = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });

//     if (!existingProfile) {
//       return res.status(404).json({
//         message: "Profile not found",
//         success: false,
//       });
//     }

//     // comment
//     const cityCode = Number(req.body.PR_CITY_CODE);
//     if (cityCode) {
//       const cityExists = await prisma.city.findUnique({
//         where: { CITY_ID: cityCode },
//       });

//       if (!cityExists) {
//         return res.status(400).json({
//           message: "Invalid PR_CITY_CODE — city not found",
//           success: false,
//         });
//       }
//     }

//     // Handle file upload
//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       console.log("📸 File received:", req.file);
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

//         console.log("📤 Upload API Response:", uploadResponse.data);

//         if (uploadResponse.data && uploadResponse.data.status === "success") {
//           PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
//           console.log("✅ File uploaded successfully! 📂", PR_PHOTO_URL);
//         } else {
//           console.error(
//             "❌ Unexpected response from Hostinger API:",
//             uploadResponse.data
//           );
//           throw new Error("Invalid response from Hostinger API");
//         }
//       } catch (uploadError) {
//         console.error("❌ File upload error:", uploadError.message);
//         return res.status(500).json({
//           message: "File upload failed",
//           success: false,
//           error: uploadError.message,
//         });
//       }
//     } else {
//       console.log("ℹ️ No file uploaded, proceeding with existing photo.");
//     }

//     // Parse Children data if it exists
//     let childrenData = [];
//     if (req.body.Children) {
//       try {
//         childrenData =
//           typeof req.body.Children === "string"
//             ? JSON.parse(req.body.Children)
//             : req.body.Children;
//       } catch (e) {
//         console.error("Error parsing Children data:", e);
//         return res.status(400).json({
//           message: "Invalid Children data format",
//           success: false,
//         });
//       }
//     }

//     // Process children updates in a transaction
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
//               data: {
//                 name: child.name,
//                 dob: new Date(child.dob),
//               },
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

//     // Prepare update data
//     const updateData = {
//       PR_FULL_NAME: req?.body?.PR_FULL_NAME,
//       PR_DOB: req?.body?.PR_DOB,
//       PR_MOBILE_NO: req?.body?.PR_MOBILE_NO,
//       PR_GENDER: req?.body?.PR_GENDER,
//       PR_PIN_CODE: req?.body?.PR_PIN_CODE,
//       PR_AREA_NAME: req?.body?.PR_AREA_NAME,
//       PR_ADDRESS: req?.body?.PR_ADDRESS,
//       PR_STATE_CODE: req?.body?.PR_STATE_CODE,
//       PR_DISTRICT_CODE: req?.body?.PR_DISTRICT_CODE,
//       PR_EDUCATION: req?.body?.PR_EDUCATION,
//       PR_EDUCATION_DESC: req?.body?.PR_EDUCATION_DESC,
//       PR_PROFESSION_DETA: req?.body?.PR_PROFESSION_DETA,
//       PR_MARRIED_YN: req?.body?.PR_MARRIED_YN,
//       PR_FATHER_ID: req?.body?.PR_FATHER_ID,
//       PR_MOTHER_ID: req?.body?.PR_MOTHER_ID,
//       PR_SPOUSE_ID: req?.body?.PR_SPOUSE_ID,
//       // PR_CITY_CODE: req?.body?.PR_CITY_CODE,
//       PR_CITY_CODE: cityCode,
//       PR_FATHER_NAME: req?.body?.PR_FATHER_NAME,
//       PR_MOTHER_NAME: req?.body?.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: req?.body?.PR_SPOUSE_NAME,
//       PR_BUSS_INTER: req?.body?.PR_BUSS_INTER,
//       PR_BUSS_STREAM: req?.body?.PR_BUSS_STREAM,
//       PR_BUSS_TYPE: req?.body?.PR_BUSS_TYPE,
//       PR_HOBBY: req?.body?.PR_HOBBY,
//       PR_PROFESSION_ID: Number(req?.body?.PR_PROFESSION_ID),
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL: PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//     };

//     // Check if location fields changed
//     const locationChanged =
//       req?.body?.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
//       req?.body?.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
//       req?.body?.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

//     if (locationChanged) {
//       const newStateCode =
//         req?.body?.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req?.body?.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode =
//         req?.body?.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

//       // Find all family members (same mobile number)
//       const familyMembers = await prisma.peopleRegistry.findMany({
//         where: { PR_MOBILE_NO: existingProfile.PR_MOBILE_NO },
//         orderBy: { PR_ID: "asc" },
//       });

//       // Find the last family in the new location
//       const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
//         where: {
//           PR_STATE_CODE: newStateCode,
//           PR_DISTRICT_CODE: newDistrictCode,
//           PR_CITY_CODE: Number(newCityCode),
//           NOT: { PR_MOBILE_NO: existingProfile.PR_MOBILE_NO },
//         },
//         orderBy: { PR_UNIQUE_ID: "desc" },
//       });

//       let familyNumber = "001";
//       if (lastFamilyInLocation) {
//         const parts = lastFamilyInLocation.PR_UNIQUE_ID?.split("-");
//         if (parts?.length === 4) {
//           const lastFamilyNum = parseInt(parts[2]);
//           familyNumber = (lastFamilyNum + 1).toString().padStart(3, "0");
//         }
//       }

//       // Update all family members with new location-based ID

//       await prisma.$transaction(async (tx) => {
//         for (let i = 0; i < familyMembers.length; i++) {
//           const member = familyMembers[i];
//           const familyMemberNumber = (i + 1).toString().padStart(3, "0");

//           await tx.peopleRegistry.update({
//             where: { PR_ID: member.PR_ID },
//             data: {
//               PR_UNIQUE_ID: `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${familyMemberNumber}`,
//               PR_STATE_CODE: newStateCode,
//               PR_DISTRICT_CODE: newDistrictCode,
//               PR_CITY_CODE: Number(newCityCode),
//               PR_FAMILY_NO: familyNumber, // Update family number
//               PR_MEMBER_NO: familyMemberNumber,
//             },
//           });
//         }
//       });

//       const memberIndex = familyMembers.findIndex(
//         (m) => m.PR_ID === Number(PR_ID)
//       );
//       const familyMemberNumber = (memberIndex + 1).toString().padStart(3, "0");

//       // Update the current profile's data with new location info
//       updateData.PR_UNIQUE_ID = `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${familyMemberNumber}`;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = Number(newCityCode);
//       updateData.PR_FAMILY_NO = familyNumber; // Set family number
//       updateData.PR_MEMBER_NO = familyMemberNumber;
//     }

//     // Update the main profile
//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: updateData,
//     });

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       updatedProfile,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Updation Error:", error);
//     return res.status(500).json({
//       error: error.message || "Internal server error",
//       success: false,
//     });
//   }
// }

// export default EditProfile;

import { PrismaClient } from "@prisma/client";
import { error, log } from "console";
import express from "express";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import prisma from "../db/prismaClient.js";
import { getNextFamilyNumber } from "../controllers/utils/familyUtils.js";

const app = express();

app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     if (!PR_ID) {
//       return res.status(400).json({
//         message: "PR_ID is required for updating profile",
//         success: false,
//       });
//     }

//     console.log("Received PR_ID:", PR_ID);
//     console.log("Request Body:", req.body);

//     const existingProfile = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });

//     if (!existingProfile) {
//       return res.status(404).json({
//         message: "Profile not found",
//         success: false,
//       });
//     }

//     // Validate city code if provided
//     const cityCode = Number(req.body.PR_CITY_CODE);
//     if (cityCode) {
//       const cityExists = await prisma.city.findUnique({
//         where: { CITY_ID: cityCode },
//       });

//       if (!cityExists) {
//         return res.status(400).json({
//           message: "Invalid PR_CITY_CODE — city not found",
//           success: false,
//         });
//       }
//     }

//     // Handle file upload
//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       console.log("📸 File received:", req.file);
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

//         console.log("📤 Upload API Response:", uploadResponse.data);

//         if (uploadResponse.data && uploadResponse.data.status === "success") {
//           PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
//           console.log("✅ File uploaded successfully! 📂", PR_PHOTO_URL);
//         } else {
//           console.error(
//             "❌ Unexpected response from Hostinger API:",
//             uploadResponse.data
//           );
//           throw new Error("Invalid response from Hostinger API");
//         }
//       } catch (uploadError) {
//         console.error("❌ File upload error:", uploadError.message);
//         return res.status(500).json({
//           message: "File upload failed",
//           success: false,
//           error: uploadError.message,
//         });
//       }
//     } else {
//       console.log("ℹ️ No file uploaded, proceeding with existing photo.");
//     }

//     // Parse Children data if it exists
//     let childrenData = [];
//     if (req.body.Children) {
//       try {
//         childrenData =
//           typeof req.body.Children === "string"
//             ? JSON.parse(req.body.Children)
//             : req.body.Children;
//       } catch (e) {
//         console.error("Error parsing Children data:", e);
//         return res.status(400).json({
//           message: "Invalid Children data format",
//           success: false,
//         });
//       }
//     }

//     // Process children updates in a transaction
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
//               data: {
//                 name: child.name,
//                 dob: new Date(child.dob),
//               },
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

//     // Prepare update data
//     const updateData = {
//       PR_FULL_NAME: req?.body?.PR_FULL_NAME,
//       PR_DOB: req?.body?.PR_DOB,
//       PR_MOBILE_NO: req?.body?.PR_MOBILE_NO,
//       PR_GENDER: req?.body?.PR_GENDER,
//       PR_PIN_CODE: req?.body?.PR_PIN_CODE,
//       PR_AREA_NAME: req?.body?.PR_AREA_NAME,
//       PR_ADDRESS: req?.body?.PR_ADDRESS,
//       PR_STATE_CODE: req?.body?.PR_STATE_CODE,
//       PR_DISTRICT_CODE: req?.body?.PR_DISTRICT_CODE,
//       PR_EDUCATION: req?.body?.PR_EDUCATION,
//       PR_EDUCATION_DESC: req?.body?.PR_EDUCATION_DESC,
//       PR_PROFESSION_DETA: req?.body?.PR_PROFESSION_DETA,
//       PR_MARRIED_YN: req?.body?.PR_MARRIED_YN,
//       PR_FATHER_ID: req?.body?.PR_FATHER_ID,
//       PR_MOTHER_ID: req?.body?.PR_MOTHER_ID,
//       PR_SPOUSE_ID: req?.body?.PR_SPOUSE_ID,
//       PR_CITY_CODE: cityCode,
//       PR_FATHER_NAME: req?.body?.PR_FATHER_NAME,
//       PR_MOTHER_NAME: req?.body?.PR_MOTHER_NAME,
//       PR_SPOUSE_NAME: req?.body?.PR_SPOUSE_NAME,
//       PR_BUSS_INTER: req?.body?.PR_BUSS_INTER,
//       PR_BUSS_STREAM: req?.body?.PR_BUSS_STREAM,
//       PR_BUSS_TYPE: req?.body?.PR_BUSS_TYPE,
//       PR_HOBBY: req?.body?.PR_HOBBY,
//       PR_PROFESSION_ID: Number(req?.body?.PR_PROFESSION_ID),
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL: PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//     };

//     // Check if location fields changed
//     const locationChanged =
//       req?.body?.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
//       req?.body?.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
//       req?.body?.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

//     if (locationChanged) {
//       const newStateCode =
//         req?.body?.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req?.body?.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode =
//         req?.body?.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

//       // Find the last family in the new location
//       const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
//         where: {
//           PR_STATE_CODE: newStateCode,
//           PR_DISTRICT_CODE: newDistrictCode,
//           PR_CITY_CODE: Number(newCityCode),
//         },
//         orderBy: { PR_UNIQUE_ID: "desc" },
//       });

//       let familyNumber = "001";
//       if (lastFamilyInLocation) {
//         const parts = lastFamilyInLocation.PR_UNIQUE_ID?.split("-");
//         if (parts?.length === 4) {
//           const lastFamilyNum = parseInt(parts[2]);
//           familyNumber = (lastFamilyNum + 1).toString().padStart(3, "0");
//         }
//       }

//       // Find all family members (same mobile number) to determine member number
//       const familyMembers = await prisma.peopleRegistry.findMany({
//         where: { PR_MOBILE_NO: existingProfile.PR_MOBILE_NO },
//         orderBy: { PR_ID: "asc" },
//       });

//       const memberIndex = familyMembers.findIndex(
//         (m) => m.PR_ID === Number(PR_ID)
//       );
//       const familyMemberNumber = (memberIndex + 1).toString().padStart(3, "0");

//       // Update only the current profile's data with new location info
//       updateData.PR_UNIQUE_ID = `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${familyMemberNumber}`;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = Number(newCityCode);
//       updateData.PR_FAMILY_NO = familyNumber;
//       updateData.PR_MEMBER_NO = familyMemberNumber;
//     }

//     // Update the main profile
//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: updateData,
//     });

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       updatedProfile,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Updation Error:", error);
//     return res.status(500).json({
//       error: error.message || "Internal server error",
//       success: false,
//     });
//   }
// }

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

    let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
    if (req.file) {
      const filePath = req.file.path;
      const formData = new FormData();
      formData.append("image", fs.createReadStream(filePath), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
      try {
        const uploadResponse = await axios.post(
          process.env.HOSTINGER_UPLOAD_API_URL,
          formData,
          { headers: { ...formData.getHeaders() } }
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
          const existingChild = existingChildren.find((c) => c.id === child.id);
          if (existingChild) {
            await tx.child.update({
              where: { id: existingChild.id },
              data: { name: child.name, dob: new Date(child.dob) },
            });
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

    const isCompleted =
      req.body.PR_FULL_NAME &&
      req.body.PR_DOB &&
      req.body.PR_MOBILE_NO &&
      req.body.PR_PIN_CODE &&
      req.body.PR_AREA_NAME &&
      req.body.PR_ADDRESS &&
      req.body.PR_FATHER_NAME &&
      req.body.PR_MOTHER_NAME
        ? "Y"
        : "N";

    const updateData = {
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
      PR_FATHER_ID: req.body.PR_FATHER_ID,
      PR_MOTHER_ID: req.body.PR_MOTHER_ID,
      PR_SPOUSE_ID: req.body.PR_SPOUSE_ID,
      PR_CITY_CODE: cityCode,
      PR_FATHER_NAME: req.body.PR_FATHER_NAME,
      PR_MOTHER_NAME: req.body.PR_MOTHER_NAME,
      PR_SPOUSE_NAME: req.body.PR_SPOUSE_NAME,
      PR_BUSS_INTER: req.body.PR_BUSS_INTER,
      PR_BUSS_STREAM: req.body.PR_BUSS_STREAM,
      PR_BUSS_TYPE: req.body.PR_BUSS_TYPE,
      PR_HOBBY: req.body.PR_HOBBY,
      PR_PROFESSION_ID: Number(req.body.PR_PROFESSION_ID),
      PR_UPDATED_AT: new Date(),
      PR_PHOTO_URL: PR_PHOTO_URL,
      PR_IS_COMPLETED: isCompleted,
    };

    const locationChanged =
      req.body.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
      req.body.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
      req.body.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

    if (locationChanged) {
      const newStateCode =
        req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
      const newDistrictCode =
        req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
      const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

      // Get all family members with same mobile number
      const familyMembers = await prisma.peopleRegistry.findMany({
        where: { PR_MOBILE_NO: existingProfile.PR_MOBILE_NO },
        orderBy: { PR_ID: "asc" },
      });

      let familyNumber;
      let memberNumber;

      if (familyMembers.length > 0) {
        // Use existing family number or create new if none exists
        familyNumber = familyMembers[0]?.PR_FAMILY_NO;

        // Get next member number in sequence
        memberNumber = familyMembers.length.toString().padStart(3, "0");
      } else {
        const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
          where: {
            PR_STATE_CODE: newStateCode,
            PR_DISTRICT_CODE: newDistrictCode,
            PR_CITY_CODE: Number(newCityCode),
          },
          orderBy: { PR_FAMILY_NO: "desc" },
        });

        familyNumber = lastFamilyInLocation
          ? (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
              .toString()
              .padStart(3, "0")
          : "001";

        memberNumber = "001";
      }
      // Update only the current profile
      updateData.PR_UNIQUE_ID = `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${memberNumber}`;
      updateData.PR_STATE_CODE = newStateCode;
      updateData.PR_DISTRICT_CODE = newDistrictCode;
      updateData.PR_CITY_CODE = Number(newCityCode);
      updateData.PR_FAMILY_NO = familyNumber;
      updateData.PR_MEMBER_NO = memberNumber;
    }

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
