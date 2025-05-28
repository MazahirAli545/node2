import prisma from "../db/prismaClient.js";

export const getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "Please provide PR_IDs as a comma-separated list in the query",
      });
    }

    // Convert comma-separated string to an array of numbers
    const idArray = ids
      .split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid PR_IDs provided",
      });
    }

    const users = await prisma.peopleRegistry.findMany({
      where: {
        PR_ID: {
          in: idArray,
        },
      },
      include: {
        Profession: true,
        City: true,
        BUSSINESS: true,
        Children: true,
      },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found with the provided PR_IDs",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users by PR_IDs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
