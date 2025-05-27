// import prisma from "../db/prismaClient.js";

// export const getUsersByMobileNumber = async (req, res) => {
//   try {
//     const { mobileNumber } = req.params; // Extract mobile number from URL params

//     // Fetch all users with the given mobile number
//     const users = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_MOBILE_NO: mobileNumber, // Exact match on mobile number
//       },
//       include: {
//         // Include related data (optional)
//         Profession: true,
//         City: true,
//         BUSSINESS: true,
//         Children: true,
//       },
//     });

//     if (users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found with this mobile number",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Users fetched successfully",
//       count: users.length,
//       users,
//     });
//   } catch (error) {
//     console.error("Error fetching users by mobile number:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

import prisma from "../db/prismaClient.js";

export const getUserByPrId = async (req, res) => {
  try {
    const { prId } = req.params; // Extract PR_ID from URL params

    // Fetch user with the given PR_ID
    const user = await prisma.peopleRegistry.findUnique({
      where: {
        PR_ID: parseInt(prId), // Convert to integer if PR_ID is numeric
      },
      include: {
        // Include related data (optional)
        Profession: true,
        City: true,
        BUSSINESS: true,
        Children: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this PR_ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user by PR_ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
