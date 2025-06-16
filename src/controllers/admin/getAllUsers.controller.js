import prisma from "../../db/prismaClient.js";

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

// Helper function to convert PR_UNIQUE_ID to PR_ID
const convertUniqueIdToId = async (uniqueId) => {
  if (!uniqueId) return null;

  try {
    const person = await prisma.peopleRegistry.findFirst({
      where: {
        PR_UNIQUE_ID: uniqueId,
      },
      select: {
        PR_ID: true,
      },
    });

    return person ? person.PR_ID : null;
  } catch (error) {
    console.error(`Error converting PR_UNIQUE_ID ${uniqueId} to PR_ID:`, error);
    return null;
  }
};

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

    // Process each user to replace PR_ID with PR_UNIQUE_ID for related persons
    const processedUsers = await Promise.all(
      users.map(async (user) => {
        const newUser = { ...user }; // Create a mutable copy of the user object

        if (newUser.PR_FATHER_ID) {
          newUser.PR_FATHER_ID = await convertIdToUniqueId(newUser.PR_FATHER_ID);
        }
        if (newUser.PR_MOTHER_ID) {
          newUser.PR_MOTHER_ID = await convertIdToUniqueId(newUser.PR_MOTHER_ID);
        }
        if (newUser.PR_SPOUSE_ID) {
          newUser.PR_SPOUSE_ID = await convertIdToUniqueId(newUser.PR_SPOUSE_ID);
        }
        return newUser;
      })
    );

    return res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: processedUsers, // Return the processed users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

export async function getUserProfile(req, res) {
  try {
    const { uniqueID } = req.params;

    if (!uniqueID) {
      return res.status(400).json({ message: "Missing unique ID", success: false });
    }

    const userId = await convertUniqueIdToId(uniqueID);
    console.log("Received PR_UNIQUE_ID:", uniqueID);

    if (!userId) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    // Convert related IDs to PR_UNIQUE_ID
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


export const deleteUser = async (req, res) => {
  try {
    const { prId } = req.params;

    if (!prId) {
      return res.status(400).json({ success: false, message: "PR_ID is required for deletion." });
    }

    // Ensure prId is an integer if your PR_ID field in the database is an integer
    const userIdToDelete = parseInt(prId, 10);

    if (isNaN(userIdToDelete)) {
      return res.status(400).json({ success: false, message: "Invalid PR_ID provided." });
    }

    // Delete the user from the PeopleRegistry
    await prisma.peopleRegistry.delete({
      where: {
        PR_ID: userIdToDelete,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User with PR_ID ${prId} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    // Check if the error is due to a record not found
    if (error.code === 'P2025') { // Prisma's error code for record not found
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete user.",
    });
  }
};
