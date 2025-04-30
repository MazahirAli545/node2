import prisma from "../db/prismaClient.js";

export const getUsersByMobileNumber = async (req, res) => {
  try {
    const { mobileNumber } = req.params; // Extract mobile number from URL params

    // Fetch all users with the given mobile number
    const users = await prisma.peopleRegistry.findMany({
      where: {
        PR_MOBILE_NO: mobileNumber, // Exact match on mobile number
      },
      include: {
        // Include related data (optional)
        Profession: true,
        City: true,
        BUSSINESS: true,
        Children: true,
      },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found with this mobile number",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users by mobile number:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
