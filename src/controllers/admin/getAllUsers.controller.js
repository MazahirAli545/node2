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

export const getUserByPrId = async (req, res) => {
  try {
    const { prId } = req.params;

    if (!prId) {
      return res.status(400).json({ success: false, message: "PR_ID parameter is missing." });
    }

    const userId = parseInt(prId, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid PR_ID provided. Must be a number." });
    }

    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
        BUSSINESS: true, // Include BUSSINESS model
        // Add any other models that are part of your UserFormData
        // e.g., Contact: true, if you need contact details
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: `User with PR_ID ${prId} not found.` });
    }

    // Convert related IDs (father, mother, spouse) to PR_UNIQUE_ID for consistency
    // in the response, especially since the frontend mapping relies on it.
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
    
    // Ensure nested objects that are null from Prisma are handled for frontend
    if (!convertedUser.Profession) convertedUser.Profession = null;
    if (!convertedUser.City) convertedUser.City = null;
    if (!convertedUser.BUSSINESS) convertedUser.BUSSINESS = null;


    return res.status(200).json({
      success: true,
      message: `User with PR_ID ${prId} fetched successfully.`,
      data: convertedUser,
    });

  } catch (error) {
    console.error("Error fetching user by PR_ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user by PR_ID.",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { prId } = req.params;

    if (!prId) {
      return res.status(400).json({ success: false, message: "PR_ID is required for deletion." });
    }

    const userIdToDelete = parseInt(prId, 10);

    if (isNaN(userIdToDelete)) {
      return res.status(400).json({ success: false, message: "Invalid PR_ID provided." });
    }

    // Use a Prisma transaction to ensure atomicity:
    // All operations within this transaction will either succeed together or fail together.
    await prisma.$transaction(async (prisma) => {
      // Step 1: Delete all related Child records for this user
      // IMPORTANT: Ensure 'userId' (or whatever your foreign key field is named in Child model)
      // correctly links to the PeopleRegistry's PR_ID.
      await prisma.child.deleteMany({
        where: {
          userId: userIdToDelete, // This line targets children linked by 'userId'
        },
      });

      // Step 2: Delete all related Contact records for this user
      // Corrected: Assuming 'CON_CREATED_BY' is the foreign key in your Contact table linking to PeopleRegistry.
      // If it's different (e.g., a direct relation field like 'user' or another scalar field), please adjust accordingly.
      await prisma.contact.deleteMany({
        where: {
          CON_CREATED_BY: userIdToDelete, // Changed from PR_ID to CON_CREATED_BY
        },
      });

      // Add any other related models that directly reference PeopleRegistry
      // For example, if you have an 'Address' table linked by PR_ID (or userId):
      // await prisma.address.deleteMany({
      //   where: {
      //     PR_ID: userIdToDelete, // Adjust based on your schema
      //   },
      // });

      // Step 3: Finally, delete the PeopleRegistry record itself
      await prisma.peopleRegistry.delete({
        where: {
          PR_ID: userIdToDelete,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: `User with PR_ID ${prId} and all related records (including children) deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "User not found or already deleted." });
    }
    if (error.code === 'P2003') {
      let errorMessage = `Cannot delete user with PR_ID ${prId} because there are still dependent entries linked to this user.`;
      if (error.meta && error.meta.field_name) {
        errorMessage += ` Specific dependency found in field: '${error.meta.field_name}'.`;
      }
      errorMessage += ` Please ensure all related entries (e.g., Children, Contacts, or any other linked data) are deleted first or review your Prisma schema for cascading deletes.`;
      return res.status(409).json({ success: false, message: errorMessage });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to delete user. Please check server logs for more details.",
    });
  }
};


