import { PrismaClient } from "@prisma/client";
import { error } from "console";
import express from "express";

const app = express();
const prisma = new PrismaClient();

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
    const PR_ID = req.headers.pr_id;
    if (!PR_ID) {
      return res.status(404).json({
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
      return res
        .status(404)
        .json({ message: "Profile not found", success: false });
    }

    if (JSON.stringify(existingProfile) === JSON.stringify(req.body)) {
      return res
        .status(400)
        .json({ message: "No changes detected", success: false });
    }

    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: {
        ...req.body,
        PR_UPDATED_AT: new Date(),
        PR_UPDATED_BY: "System",
      },
    });

    console.log("Updated Profile:", updatedProfile);

    return res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile,
    });
  } catch (error) {
    console.error("Error Updating Profile", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default EditProfile;
