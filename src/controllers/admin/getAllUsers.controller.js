import prisma from "../../db/prismaClient.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.peopleRegistry.findMany({
      include: {
        Children: true, // includes related children
        City: true, // includes city name & code
        Profession: true, // includes profession
        BUSSINESS: true, // includes business details
        Contact: true, // includes contact info if needed
      },                                            
      orderBy: {
        PR_ID: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// Helper function to convert PR_ID to PR_UNIQUE_ID
const convertIdToUniqueId = async (prId) => {
  if (!prId) return null;

  try {
    const person = await prisma.peopleRegistry.findUnique({
      where: {
        PR_ID: prId,
      },
      select: {
        PR_UNIQUE_ID: true,
      },
    });

    return person ? person.PR_UNIQUE_ID : null;
  } catch (error) {
    console.error(`Error converting PR_ID ${prId} to PR_UNIQUE_ID:`, error);
    return null;
  }
};

export async function getUserProfile(req, res) {
  try {
    const { uniqueID } = req.params;
    const userId = parseInt(uniqueID);
    console.log("User ID: ", userId);

    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Convert PR_ID to PR_UNIQUE_ID for PR_FATHER_ID, PR_MOTHER_ID, and PR_SPOUSE_ID
    const convertedUser = { ...user };

    if (user.PR_FATHER_ID) {
      convertedUser.PR_FATHER_ID = await convertIdToUniqueId(user.PR_FATHER_ID);
    }

    if (user.PR_MOTHER_ID) {
      convertedUser.PR_MOTHER_ID = await convertIdToUniqueId(user.PR_MOTHER_ID);
    }

    if (user.PR_SPOUSE_ID) {
      convertedUser.PR_SPOUSE_ID = await convertIdToUniqueId(user.PR_SPOUSE_ID);
    }

    res.status(200).json({
      message: "User data fetched successfully",
      success: true,
      data: convertedUser,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Something went wrong", success: false });
  }
}
