// updateLanguage.controller.js
import prisma from "../db/prismaClient.js";

export const updateUserLanguage = async (req, res) => {
  try {
    const PR_ID = req.headers.pr_id;
    const { PR_LANG } = req.body;

    if (!PR_ID) {
      return res.status(400).json({
        success: false,
        message: "PR_ID is required",
      });
    }

    if (!PR_LANG || !["en", "hi"].includes(PR_LANG)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing language code. Must be 'en' or 'hi'.",
      });
    }

    const updatedUser = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: { PR_LANG },
    });

    return res.status(200).json({
      success: true,
      message: "Language updated successfully",
      data: { PR_ID: updatedUser.PR_ID, PR_LANG: updatedUser.PR_LANG },
    });
  } catch (error) {
    console.error("Error updating language:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
