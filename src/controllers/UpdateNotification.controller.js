import prisma from "../db/prismaClient.js";

export const UpdateNotification = async (req, res) => {
  try {
    const PR_ID = req.headers.pr_id;
    const { PR_NOTIFICATION } = req.body;

    if (!PR_ID) {
      return res.status(400).json({
        message: "PR_ID is required",
        success: false,
      });
    }

    if (!["Y", "N"].includes(PR_NOTIFICATION)) {
      return res.status(400).json({
        message: "PR_NOTIFICATION must be 'Y' or 'N'",
        success: false,
      });
    }

    const updatedProfile = await prisma.peopleRegistry.update({
      where: { PR_ID: Number(PR_ID) },
      data: { PR_NOTIFICATION },
    });

    return res.status(200).json({
      message: "Notification preference updated",
      updatedProfile,
      success: true,
    });
  } catch (error) {
    console.error("Notification update failed:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
    });
  }
};

// export default UpdateNotification;
