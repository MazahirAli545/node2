import { PrismaClient } from "@prisma/client";
import { error, log } from "console";
import express from "express";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const app = express();
const prisma = new PrismaClient();

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

//     // if (!Object.keys(req.body).length) {
//     //   return res.status(400).json({
//     //     message: "No data provided for update",
//     //     success: false,
//     //   });
//     // }

//     const existingProfile = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: Number(PR_ID) },
//     });

//     if (!existingProfile) {
//       return res.status(404).json({
//         message: "Profile not found",
//         success: false,
//       });
//     }

//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       console.log("File received:", req.file);
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

//     var Children = req?.body?.Children;

//     if (Array.isArray(Children) && Children.length > 0) {
//       const childPromises = Children.filter(
//         (child) => child.name && child.dob
//       ).map(async (child) => {
//         const existingChild = await prisma.child.findFirst({
//           where: {
//             id: child.id.toString(),
//           },
//         });

//         // console.log("existing child: ", existingChild);

//         if (existingChild) {
//           // Update the existing child
//           return prisma.child.update({
//             where: { id: existingChild.id },
//             data: {
//               name: child.name,
//               dob: new Date(child.dob),
//             },
//           });
//         } else {
//           // Insert a new child record
//           return prisma.child.create({
//             data: {
//               name: child.name,
//               dob: new Date(child.dob),
//               userId: Number(PR_ID),
//             },
//           });
//         }
//       });

//       await Promise.all(childPromises);
//     }

//     req.body.Children = { create: [] };

//     // const dattaa = { ...req.body };
//     // console.log("DATATA", dattaa);
//     console.log("MAMAMAMAM", req.body);
//     console.log("DARARAR", req.body.Children.data);

//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: {
//         // ...req.body,
//         // PR_ID: Number(req?.body.PR_ID),
//         // PR_ID: (req?.body?.PR_ID),
//         PR_FULL_NAME: req?.body?.PR_FULL_NAME,
//         PR_DOB: req?.body?.PR_DOB,
//         PR_MOBILE_NO: req?.body?.PR_MOBILE_NO,
//         PR_GENDER: req?.body?.PR_GENDER,
//         PR_PIN_CODE: req?.body?.PR_PIN_CODE,
//         PR_AREA_NAME: req?.body?.PR_AREA_NAME,
//         PR_ADDRESS: req?.body?.PR_ADDRESS,
//         PR_STATE_CODE: req?.body?.PR_STATE_CODE,
//         PR_DISTRICT_CODE: req?.body?.PR_DISTRICT_CODE,
//         PR_EDUCATION: req?.body?.PR_EDUCATION,
//         PR_EDUCATION_DESC: req?.body?.PR_EDUCATION_DESC,
//         PR_PROFESSION_DETA: req?.body?.PR_PROFESSION_DETA,
//         PR_MARRIED_YN: req?.body?.PR_MARRIED_YN,
//         PR_FATHER_ID: req?.body?.PR_FATHER_ID,
//         PR_MOTHER_ID: req?.body?.PR_MOTHER_ID,
//         PR_SPOUSE_ID: req?.body?.PR_SPOUSE_ID,
//         PR_CITY_CODE: req?.body?.PR_CITY_CODE,
//         PR_FATHER_NAME: req?.body?.PR_FATHER_NAME,
//         PR_MOTHER_NAME: req?.body?.PR_MOTHER_NAME,
//         PR_SPOUSE_NAME: req?.body?.PR_SPOUSE_NAME,
//         PR_BUSS_INTER: req?.body?.PR_BUSS_INTER,
//         PR_BUSS_STREAM: req?.body?.PR_BUSS_STREAM,
//         PR_BUSS_TYPE: req?.body?.PR_BUSS_TYPE,
//         PR_HOBBY: req?.body?.PR_HOBBY,
//         PR_PROFESSION_ID: Number(req?.body?.PR_PROFESSION_ID),
//         PR_UPDATED_AT: new Date(),
//         // Children: req.body.Children,
//         PR_PHOTO_URL: PR_PHOTO_URL,
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
//             // userId: newUser.PR_ID,
//             userId: Number(PR_ID),
//           },
//         });
//       });
//       // console.log("Childrennsssssss", Children)
//       await Promise.all(childPromises);
//     }

//     console.log("Updated Profile:", updatedProfile);

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       updatedProfile,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Updation Error:", error);
//     return res
//       .status(500)
//       .json({ error: error.message || "Internal server error" });
//   }
// }

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

//     // Handle file upload (keep existing code)
//     let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
//     if (req.file) {
//       // ... (keep existing file upload code)
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
//         // First get all existing children for this user
//         const existingChildren = await tx.child.findMany({
//           where: { userId: Number(PR_ID) },
//         });

//         // Process each child from the request
//         for (const child of childrenData) {
//           if (!child.name || !child.dob) continue;

//           // Check if this child exists already
//           const existingChild = existingChildren.find((c) => c.id === child.id);

//           if (existingChild) {
//             // Update existing child
//             await tx.child.update({
//               where: { id: existingChild.id },
//               data: {
//                 name: child.name,
//                 dob: new Date(child.dob),
//               },
//             });
//           } else {
//             // Create new child
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

//     // Update the main profile
//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: {

//         PR_FULL_NAME: req?.body?.PR_FULL_NAME,
//         PR_DOB: req?.body?.PR_DOB,
//         PR_MOBILE_NO: req?.body?.PR_MOBILE_NO,
//         PR_GENDER: req?.body?.PR_GENDER,
//         PR_PIN_CODE: req?.body?.PR_PIN_CODE,
//         PR_AREA_NAME: req?.body?.PR_AREA_NAME,
//         PR_ADDRESS: req?.body?.PR_ADDRESS,
//         PR_STATE_CODE: req?.body?.PR_STATE_CODE,
//         PR_DISTRICT_CODE: req?.body?.PR_DISTRICT_CODE,
//         PR_EDUCATION: req?.body?.PR_EDUCATION,
//         PR_EDUCATION_DESC: req?.body?.PR_EDUCATION_DESC,
//         PR_PROFESSION_DETA: req?.body?.PR_PROFESSION_DETA,
//         PR_MARRIED_YN: req?.body?.PR_MARRIED_YN,
//         PR_FATHER_ID: req?.body?.PR_FATHER_ID,
//         PR_MOTHER_ID: req?.body?.PR_MOTHER_ID,
//         PR_SPOUSE_ID: req?.body?.PR_SPOUSE_ID,
//         PR_CITY_CODE: req?.body?.PR_CITY_CODE,
//         PR_FATHER_NAME: req?.body?.PR_FATHER_NAME,
//         PR_MOTHER_NAME: req?.body?.PR_MOTHER_NAME,
//         PR_SPOUSE_NAME: req?.body?.PR_SPOUSE_NAME,
//         PR_BUSS_INTER: req?.body?.PR_BUSS_INTER,
//         PR_BUSS_STREAM: req?.body?.PR_BUSS_STREAM,
//         PR_BUSS_TYPE: req?.body?.PR_BUSS_TYPE,
//         PR_HOBBY: req?.body?.PR_HOBBY,
//         PR_PROFESSION_ID: Number(req?.body?.PR_PROFESSION_ID),
//         PR_UPDATED_AT: new Date(),
//         PR_PHOTO_URL: PR_PHOTO_URL,
//       },
//     });

//     return res.status(200).json({
//       message: "Profile updated successfully",
//       updatedProfile,
//       success: true,
//     });
//   } catch (error) {
//     console.error("Updation Error:", error);
//     return res
//       .status(500)
//       .json({ error: error.message || "Internal server error" });
//   }
// }

async function EditProfile(req, res) {
  try {
    const PR_ID = req.headers.pr_id;
    if (!PR_ID) {
      return res.status(400).json({
        message: "PR_ID is required for updating profile",
        success: false,
      });
    }

    console.log("Received PR_ID:", PR_ID);
    console.log("Request Body:", req.body);

    const existingProfile = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: Number(PR_ID) },
    });

    if (!existingProfile) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }

    // Handle file upload (keep existing code)
    let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
    if (req.file) {
      // ... (keep existing file upload code)
    } else {
      console.log("ℹ️ No file uploaded, proceeding with existing photo.");
    }

    // Parse Children data if it exists
    let childrenData = [];
    if (req.body.Children) {
      try {
        childrenData =
          typeof req.body.Children === "string"
            ? JSON.parse(req.body.Children)
            : req.body.Children;
      } catch (e) {
        console.error("Error parsing Children data:", e);
        return res.status(400).json({
          message: "Invalid Children data format",
          success: false,
        });
      }
    }

    // Process children updates in a transaction
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
              data: {
                name: child.name,
                dob: new Date(child.dob),
              },
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

    // Prepare update data
    const updateData = {
      PR_FULL_NAME: req?.body?.PR_FULL_NAME,
      PR_DOB: req?.body?.PR_DOB, // Format as needed for your schema
      PR_MOBILE_NO: req?.body?.PR_MOBILE_NO,
      PR_GENDER: req?.body?.PR_GENDER,
      PR_PIN_CODE: req?.body?.PR_PIN_CODE,
      PR_AREA_NAME: req?.body?.PR_AREA_NAME,
      PR_ADDRESS: req?.body?.PR_ADDRESS,
      PR_STATE_CODE: req?.body?.PR_STATE_CODE,
      PR_DISTRICT_CODE: req?.body?.PR_DISTRICT_CODE,
      PR_EDUCATION: req?.body?.PR_EDUCATION,
      PR_EDUCATION_DESC: req?.body?.PR_EDUCATION_DESC,
      PR_PROFESSION_DETA: req?.body?.PR_PROFESSION_DETA,
      PR_MARRIED_YN: req?.body?.PR_MARRIED_YN,
      PR_FATHER_ID: req?.body?.PR_FATHER_ID,
      PR_MOTHER_ID: req?.body?.PR_MOTHER_ID,
      PR_SPOUSE_ID: req?.body?.PR_SPOUSE_ID,
      PR_CITY_CODE: req?.body?.PR_CITY_CODE,
      PR_FATHER_NAME: req?.body?.PR_FATHER_NAME,
      PR_MOTHER_NAME: req?.body?.PR_MOTHER_NAME,
      PR_SPOUSE_NAME: req?.body?.PR_SPOUSE_NAME,
      PR_BUSS_INTER: req?.body?.PR_BUSS_INTER,
      PR_BUSS_STREAM: req?.body?.PR_BUSS_STREAM,
      PR_BUSS_TYPE: req?.body?.PR_BUSS_TYPE,
      PR_HOBBY: req?.body?.PR_HOBBY,
      PR_PROFESSION_ID: Number(req?.body?.PR_PROFESSION_ID),
      PR_UPDATED_AT: new Date(),
      PR_PHOTO_URL: PR_PHOTO_URL,
    };

    console.log("909090", updateData.PR_CITY_CODE);

    // Only update PR_UNIQUE_ID if location fields changed
    const locationChanged =
      req?.body?.PR_STATE_CODE !== existingProfile.PR_STATE_CODE ||
      req?.body?.PR_DISTRICT_CODE !== existingProfile.PR_DISTRICT_CODE ||
      req?.body?.PR_CITY_CODE !== existingProfile.PR_CITY_CODE;

    if (locationChanged) {
      // Get the city code from either the request body or existing profile
      const cityCode =
        req?.body?.PR_CITY_CODE || existingProfile.PR_CITY_CODE || "00";

      updateData.PR_UNIQUE_ID = `${
        req?.body?.PR_STATE_CODE || existingProfile.PR_STATE_CODE
      }${
        req?.body?.PR_DISTRICT_CODE || existingProfile.PR_DISTRICT_CODE
      }-${cityCode}-001-001`;
    }

    // Update the main profile
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
    console.error("Updation Error:", error);
    return res.status(500).json({
      error: error.message || "Internal server error",
      success: false,
    });
  }
}

export default EditProfile;
