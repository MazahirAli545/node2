import { PrismaClient } from "@prisma/client";
import { error } from "console";
import express from "express";
import multer from "multer";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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

    // if (!Object.keys(req.body).length) {
    //   return res.status(400).json({
    //     message: "No data provided for update",
    //     success: false,
    //   });
    // }

    const existingProfile = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: Number(PR_ID) },
    });

    if (!existingProfile) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }

    let PR_PHOTO_URL = existingProfile.PR_PHOTO_URL;
    if (req.file) {
      console.log("File received:", req.file);
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

        console.log("📤 Upload API Response:", uploadResponse.data);

        if (uploadResponse.data && uploadResponse.data.status === "success") {
          PR_PHOTO_URL = `${process.env.HOSTINGER_UPLOAD_API_URL}${uploadResponse.data.url}`;
          console.log("✅ File uploaded successfully! 📂", PR_PHOTO_URL);
        } else {
          console.error(
            "❌ Unexpected response from Hostinger API:",
            uploadResponse.data
          );
          throw new Error("Invalid response from Hostinger API");
        }
      } catch (uploadError) {
        console.error("❌ File upload error:", uploadError.message);
        return res.status(500).json({
          message: "File upload failed",
          success: false,
          error: uploadError.message,
        });
      }
    } else {
      console.log("ℹ️ No file uploaded, proceeding with existing photo.");
    }

    var Children = req?.body?.Children;

    if (Array.isArray(Children) && Children.length > 0) {
      const childPromises = Children.filter(
        (child) => child.name && child.dob
      ).map(async (child) => {
        const existingChild = await prisma.child.findFirst({
          where: {
            id: child.id.toString(),
          },
        });

        console.log("existing child: ", existingChild);

        if (existingChild) {
          // Update the existing child
          return prisma.child.update({
            where: { id: existingChild.id },
            data: {
              name: child.name,
              dob: new Date(child.dob),
            },
          });
        } else {
          // Insert a new child record
          return prisma.child.create({
            data: {
              name: child.name,
              dob: new Date(child.dob),
              userId: Number(PR_ID),
            },
          });
        }
      });

      await Promise.all(childPromises);
    }

    req.body.Children = { create: [] };

    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: {
        ...req.body,
        PR_ID: Number(PR_ID),
        PR_UPDATED_AT: new Date(),
      },
    });

    console.log("Updated Profile:", updatedProfile);

    return res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile,
      success: true,
    });
  } catch (error) {
    console.error("Updation Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

export default EditProfile;
