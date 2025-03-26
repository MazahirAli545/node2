import { PrismaClient } from "@prisma/client";
import { error } from "console";
import express from "express";

const app = express();
const prisma = new PrismaClient();

async function EditProfile(req, res) {
  try {
    const PR_ID = req.headers.pr_id;
    if (!PR_ID) {
      return res.status(404).json({
        message: "PR_ID is required for updating profile",
        success: false,
      });
    }

    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID },
      data: updateData,
    });

    return res
      .status(200)
      .json({ message: "Profile updated successfully", updatedProfile });
  } catch (error) {
    console.error("Error Updating Profile", error);
    return res.status(500).json({ error: "Internal server Error" });
  }
}

export default EditProfile;
