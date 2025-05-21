// import { PrismaClient } from "@prisma/client";
// import { error, log } from "console";
// import express from "express";
// import multer from "multer";
// import fs from "fs";
// import axios from "axios";
// import FormData from "form-data";
// import prisma from "../db/prismaClient.js";
// import { getNextFamilyNumber } from "./utils/PrUnique.js";

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

//     if (locationChanged) {
//       const newStateCode =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode = req.body.PR_CITY_CODE || existingProfile.PR_CITY_CODE;

//       // Get all family members with same mobile number
//       const familyMembers = await prisma.peopleRegistry.findMany({
//         where: { PR_MOBILE_NO: existingProfile.PR_MOBILE_NO },
//         orderBy: { PR_ID: "asc" },
//       });

//       let familyNumber;
//       let memberNumber;

//       if (familyMembers.length > 0) {
//         // Use existing family number or create new if none exists
//         // familyNumber = familyMembers[0].PR_FAMILY_NO;
//         familyNumber = familyMembers[0].PR_FAMILY_NO || "0001";

//         // Get next member number in sequence

//         memberNumber = familyMembers.length.toString().padStart(4, "0");
//       } else {
//         const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
//           where: {
//             PR_STATE_CODE: newStateCode,
//             PR_DISTRICT_CODE: newDistrictCode,
//             PR_CITY_CODE: Number(newCityCode),
//           },
//           orderBy: { PR_FAMILY_NO: "desc" },
//         });

//         familyNumber = lastFamilyInLocation
//           ? (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
//               .toString()
//               .padStart(4, "0")
//           : "0001";

//         memberNumber = "0001";
//       }
//       // Update only the current profile
//       updateData.PR_UNIQUE_ID = `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${memberNumber}`;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = Number(newCityCode);
//       updateData.PR_FAMILY_NO = familyNumber;
//       updateData.PR_MEMBER_NO = memberNumber;
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
// import {
//   generateFamilyId,
//   regenerateIdForNewLocation,
// } from "../controllers/utils/familyIdUtils.js";

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
//         } else {
//           console.error(
//             "Unexpected response from upload API:",
//             uploadResponse.data
//           );
//           throw new Error("Invalid response from upload API");
//         }
//       } catch (uploadError) {
//         console.error("File upload error:", uploadError.message);
//         return res.status(500).json({
//           message: "Upload failed",
//           error: uploadError.message,
//           success: false,
//         });
//       } finally {
//         // Clean up temporary file if it exists
//         if (fs.existsSync(filePath)) {
//           fs.unlinkSync(filePath);
//         }
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
//       } catch (e) {
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

//     // Check profile completion status
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

//     // Prepare update data
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
//       PR_PROFESSION_ID: Number(req.body.PR_PROFESSION_ID) || null,
//       PR_UPDATED_AT: new Date(),
//       PR_PHOTO_URL: PR_PHOTO_URL,
//       PR_IS_COMPLETED: isCompleted,
//     };

//     // Check if location fields changed
//     const locationChanged =
//       req.body.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
//       req.body.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
//       Number(req.body.PR_CITY_CODE) !== existingProfile.PR_CITY_CODE;

//     if (locationChanged) {
//       const newStateCode =
//         req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
//       const newDistrictCode =
//         req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
//       const newCityCode =
//         Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;

//       // Use utility function to regenerate IDs for new location
//       const { PR_UNIQUE_ID, PR_FAMILY_NO, PR_MEMBER_NO } =
//         await regenerateIdForNewLocation(
//           existingProfile.PR_MOBILE_NO,
//           newStateCode,
//           newDistrictCode,
//           newCityCode,
//           Number(PR_ID)
//         );

//       // Update data with new location information
//       updateData.PR_UNIQUE_ID = PR_UNIQUE_ID;
//       updateData.PR_STATE_CODE = newStateCode;
//       updateData.PR_DISTRICT_CODE = newDistrictCode;
//       updateData.PR_CITY_CODE = newCityCode;
//       updateData.PR_FAMILY_NO = PR_FAMILY_NO;
//       updateData.PR_MEMBER_NO = PR_MEMBER_NO;
//     }

//     // Update the profile
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
//     console.error("Profile update failed:", error);
//     return res.status(500).json({
//       message: error.message || "Internal server error",
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
import {
  generateFamilyId,
  regenerateIdForNewLocation,
} from "../controllers/utils/familyIdUtils.js";

const app = express();
app.use(express.json());

// ------------------- EditProfile Function -------------------
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
        } else {
          console.error(
            "Unexpected response from upload API:",
            uploadResponse.data
          );
          throw new Error("Invalid response from upload API");
        }
      } catch (uploadError) {
        console.error("File upload error:", uploadError.message);
        return res.status(500).json({
          message: "Upload failed",
          error: uploadError.message,
          success: false,
        });
      } finally {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    let childrenData = [];
    if (req.body.Children) {
      try {
        childrenData =
          typeof req.body.Children === "string"
            ? JSON.parse(req.body.Children)
            : req.body.Children;
      } catch (e) {
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
      PR_PROFESSION_ID: Number(req.body.PR_PROFESSION_ID) || null,
      PR_UPDATED_AT: new Date(),
      PR_PHOTO_URL: PR_PHOTO_URL,
      PR_IS_COMPLETED: isCompleted,
    };

    const locationChanged =
      req.body.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
      req.body.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
      Number(req.body.PR_CITY_CODE) !== existingProfile.PR_CITY_CODE;

    if (locationChanged) {
      const newStateCode =
        req.body.PR_STATE_CODE || existingProfile.PR_STATE_CODE;
      const newDistrictCode =
        req.body.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE;
      const newCityCode =
        Number(req.body.PR_CITY_CODE) || existingProfile.PR_CITY_CODE;

      const { PR_UNIQUE_ID, PR_FAMILY_NO, PR_MEMBER_NO } =
        await regenerateIdForNewLocation(
          existingProfile.PR_MOBILE_NO,
          newStateCode,
          newDistrictCode,
          newCityCode,
          Number(PR_ID)
        );

      updateData.PR_UNIQUE_ID = PR_UNIQUE_ID;
      updateData.PR_STATE_CODE = newStateCode;
      updateData.PR_DISTRICT_CODE = newDistrictCode;
      updateData.PR_CITY_CODE = newCityCode;
      updateData.PR_FAMILY_NO = PR_FAMILY_NO;
      updateData.PR_MEMBER_NO = PR_MEMBER_NO;
    }

    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: updateData,
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile,
      success: true,
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
}

// ------------------- NEW: GET /max-code/:prefix -------------------
app.get("/max-code/:prefix", async (req, res) => {
  const prefix = req.params.prefix;

  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT CONCAT('${prefix}', '-', 
        LPAD(
          COALESCE(MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3), '-', -1)), 0) + 1, 
          4, '0')
        )
      ) AS next_code
      FROM PEOPLE_REGISTRY
      WHERE PR_UNIQUE_ID LIKE '${prefix}-%';
    `);

    const nextCode = result[0]?.next_code || `${prefix}-0001`;
    res.json({ nextCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Query failed" });
  }
});

export default EditProfile;
