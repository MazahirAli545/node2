import prisma from "../db/prismaClient.js";

export const getFamilyMembersss = async (req, res) => {
  try {
    const { id, father_id, mother_id } = req.query;

    // Validate at least one parameter is provided
    if (!id && !father_id && !mother_id) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one of: PR_ID, father_id, or mother_id",
      });
    }

    // Collect all potential family identifiers
    const familyIdentifiers = [];

    // Process father_id if provided
    if (father_id) {
      const fatherId = parseInt(father_id);
      if (isNaN(fatherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid father_id provided",
        });
      }
      familyIdentifiers.push(fatherId);
    }

    // Process mother_id if provided
    if (mother_id) {
      const motherId = parseInt(mother_id);
      if (isNaN(motherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid mother_id provided",
        });
      }
      familyIdentifiers.push(motherId);
    }

    // Process id if provided
    if (id) {
      const prId = parseInt(id);
      if (isNaN(prId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid PR_ID provided",
        });
      }
      familyIdentifiers.push(prId);
    }

    // Find all potential family members to determine base unique ID
    const potentialFamilyMembers = await prisma.peopleRegistry.findMany({
      where: {
        OR: [
          { PR_ID: { in: familyIdentifiers } },
          { PR_FATHER_ID: { in: familyIdentifiers } },
          { PR_MOTHER_ID: { in: familyIdentifiers } },
        ],
      },
      select: { PR_UNIQUE_ID: true },
    });

    // Extract all possible family prefixes
    const familyPrefixes = new Set();
    potentialFamilyMembers.forEach((member) => {
      const parts = member.PR_UNIQUE_ID?.split("-");
      if (parts && parts.length >= 3) {
        familyPrefixes.add(`${parts[0]}-${parts[1]}-${parts[2]}`);
      }
    });

    if (familyPrefixes.size === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid family identifier found",
      });
    }

    // Find all family members from all identified families
    const familyMembers = await prisma.peopleRegistry.findMany({
      where: {
        OR: Array.from(familyPrefixes).map((prefix) => ({
          PR_UNIQUE_ID: { startsWith: prefix },
        })),
        // Exclude the original person if ID was provided
        ...(id && { NOT: { PR_ID: parseInt(id) } }),
      },
      include: {
        Profession: true,
        City: true,
        BUSSINESS: true,
        Children: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Family members fetched successfully",
      count: familyMembers.length,
      familyPrefixes: Array.from(familyPrefixes),
      familyMembers,
    });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
