import { PrismaClient } from "@prisma/client";
import { error } from "console";
import express from "express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// async function EditProfile(req, res) {
//   try {
//     const PR_ID = req.headers.pr_id;
//     if (!PR_ID) {
//       return res.status(404).json({
//         message: "PR_ID is required for updating profile",
//         success: false,
//       });
//     }

//     const updatedProfile = await prisma.peopleRegistry.update({
//       where: { PR_ID: Number(PR_ID) },
//       data: req.body,
//     });

//     // console.log("wwqwqw", updatedProfile.PR_GENDER);

//     return res
//       .status(200)
//       .json({ message: "Profile updated successfully", updatedProfile });
//   } catch (error) {
//     console.error("Error Updating Profile", error);
//     return res.status(500).json({ error: "Internal server Error" });
//   }
// }

// export default EditProfile;

async function EditProfile(req, res) {
  try {
    const PR_ID = Number(req.headers.pr_id); // Convert safely

    if (!PR_ID) {
      return res.status(400).json({
        message: "PR_ID is required for updating profile",
        success: false,
      });
    }

    console.log("Received PR_ID:", PR_ID);
    console.log("Request Body:", req.body);

    // Check if request body is empty
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        message: "No data provided for update",
        success: false,
      });
    }

    // Find existing profile
    const existingProfile = await prisma.peopleRegistry.findUnique({
      where: { PR_ID },
    });

    if (!existingProfile) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }

    // Update the profile
    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID },
      data: {
        ...req.body,
        PR_UPDATED_AT: new Date(),
      },
    });

    console.log("Updated Profile:", updatedProfile);

    return res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile,
    });
  } catch (error) {
    console.error("Updation Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Profile not found for update" });
    }

    return res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
}

export default EditProfile;

// export default EditProfile;
