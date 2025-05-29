// import prisma from "../db/prismaClient.js";

// export const getFamilyMembersss = async (req, res) => {
//   try {
//     const { id, father_id, mother_id } = req.query;

//     // Validate at least one parameter is provided
//     if (!id && !father_id && !mother_id) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide at least one of: PR_ID, father_id, or mother_id",
//       });
//     }

//     // Collect all potential family identifiers
//     const familyIdentifiers = [];

//     // Process father_id if provided
//     if (father_id) {
//       const fatherId = parseInt(father_id);
//       if (isNaN(fatherId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid father_id provided",
//         });
//       }
//       familyIdentifiers.push(fatherId);
//     }

//     // Process mother_id if provided
//     if (mother_id) {
//       const motherId = parseInt(mother_id);
//       if (isNaN(motherId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid mother_id provided",
//         });
//       }
//       familyIdentifiers.push(motherId);
//     }

//     // Process id if provided
//     if (id) {
//       const prId = parseInt(id);
//       if (isNaN(prId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid PR_ID provided",
//         });
//       }
//       familyIdentifiers.push(prId);
//     }

//     // Find all potential family members to determine base unique ID
//     const potentialFamilyMembers = await prisma.peopleRegistry.findMany({
//       where: {
//         OR: [
//           { PR_ID: { in: familyIdentifiers } },
//           { PR_FATHER_ID: { in: familyIdentifiers } },
//           { PR_MOTHER_ID: { in: familyIdentifiers } },
//         ],
//       },
//       select: { PR_UNIQUE_ID: true },
//     });

//     // Extract all possible family prefixes
//     const familyPrefixes = new Set();
//     potentialFamilyMembers.forEach((member) => {
//       const parts = member.PR_UNIQUE_ID?.split("-");
//       if (parts && parts.length >= 3) {
//         familyPrefixes.add(`${parts[0]}-${parts[1]}-${parts[2]}`);
//       }
//     });

//     if (familyPrefixes.size === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No valid family identifier found",
//       });
//     }

//     // Find all family members from all identified families
//     const familyMembers = await prisma.peopleRegistry.findMany({
//       where: {
//         OR: Array.from(familyPrefixes).map((prefix) => ({
//           PR_UNIQUE_ID: { startsWith: prefix },
//         })),
//         // Exclude the original person if ID was provided
//         ...(id && { NOT: { PR_ID: parseInt(id) } }),
//       },
//       include: {
//         Profession: true,
//         City: true,
//         BUSSINESS: true,
//         Children: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Family members fetched successfully",
//       count: familyMembers.length,
//       familyPrefixes: Array.from(familyPrefixes),
//       familyMembers,
//     });
//   } catch (error) {
//     console.error("Error fetching family members:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };

// /////////////////////////////////////////////////////////////////////////////////

// import prisma from "../db/prismaClient.js";

// export const getFamilyMembersss = async (req, res) => {
//   try {
//     const { id, father_id, mother_id } = req.query;

//     if (!id && !father_id && !mother_id) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide at least one of: PR_ID, father_id, or mother_id",
//       });
//     }

//     let basePrefix = null;
//     const conditions = [];

//     if (father_id) {
//       const fatherId = parseInt(father_id);
//       if (isNaN(fatherId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid father_id provided",
//         });
//       }
//       conditions.push({ PR_FATHER_ID: fatherId });
//     }

//     if (mother_id) {
//       const motherId = parseInt(mother_id);
//       if (isNaN(motherId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid mother_id provided",
//         });
//       }
//       conditions.push({ PR_MOTHER_ID: motherId });
//     }

//     if (id) {
//       const prId = parseInt(id);
//       if (isNaN(prId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid PR_ID provided",
//         });
//       }

//       // Get base prefix from PR_UNIQUE_ID of the provided ID
//       const person = await prisma.peopleRegistry.findUnique({
//         where: { PR_ID: prId },
//         select: { PR_UNIQUE_ID: true },
//       });

//       if (person?.PR_UNIQUE_ID) {
//         const parts = person.PR_UNIQUE_ID.split("-");
//         if (parts.length >= 3) {
//           basePrefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
//           conditions.push({
//             PR_UNIQUE_ID: { startsWith: `${basePrefix}` },
//           });
//         }
//       }
//     }

//     if (conditions.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No valid identifiers or family prefix found.",
//       });
//     }

//     const familyMembers = await prisma.peopleRegistry.findMany({
//       where: {
//         OR: conditions,
//         ...(id && { NOT: { PR_ID: parseInt(id) } }),
//       },
//       include: {
//         Profession: true,
//         City: true,
//         BUSSINESS: true,
//         Children: true,
//         Father: {
//           select: {
//             PR_ID: true,
//             PR_UNIQUE_ID: true,
//             PR_FULL_NAME: true,
//           },
//         },
//         Mother: {
//           select: {
//             PR_ID: true,
//             PR_UNIQUE_ID: true,
//             PR_FULL_NAME: true,
//           },
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Family members fetched successfully",
//       count: familyMembers.length,
//       basePrefix,
//       familyMembers,
//     });
//   } catch (error) {
//     console.error("Error fetching family members:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };

////////////////////////////////////////////////////////////////////////////////////////

import prisma from "../db/prismaClient.js";

export const getFamilyMembers = async (req, res) => {
  try {
    const { id, father_id, mother_id } = req.query;

    if (!id && !father_id && !mother_id) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one of: PR_ID, father_id, or mother_id",
      });
    }

    let mainId = null;
    let priorityParam = null;

    // Determine which parameter to prioritize
    if (father_id) {
      mainId = parseInt(father_id);
      priorityParam = "father_id";
    } else if (id) {
      mainId = parseInt(id);
      priorityParam = "id";
    } else if (mother_id) {
      mainId = parseInt(mother_id);
      priorityParam = "mother_id";
    }

    if (!mainId || isNaN(mainId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter provided",
      });
    }

    // Get basePrefix using mainId
    const person = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: mainId },
      select: { PR_UNIQUE_ID: true },
    });

    if (!person || !person.PR_UNIQUE_ID) {
      return res.status(404).json({
        success: false,
        message: `Person not found or missing PR_UNIQUE_ID for ID ${mainId}`,
      });
    }

    const parts = person.PR_UNIQUE_ID.split("-");
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        message: `Invalid PR_UNIQUE_ID format: ${person.PR_UNIQUE_ID}`,
      });
    }

    const basePrefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const conditions = [{ PR_UNIQUE_ID: { startsWith: basePrefix } }];

    // Add additional conditions based on provided parameters
    if (father_id && !isNaN(parseInt(father_id))) {
      conditions.push({ PR_FATHER_ID: parseInt(father_id) });
    }
    if (mother_id && !isNaN(parseInt(mother_id))) {
      conditions.push({ PR_MOTHER_ID: parseInt(mother_id) });
    }

    const excludeId = id ? parseInt(id) : null;

    const familyMembers = await prisma.peopleRegistry.findMany({
      where: {
        OR: conditions,
        ...(excludeId && { NOT: { PR_ID: excludeId } }),
      },
      include: {
        Profession: true,
        City: true,
        BUSSINESS: true,
        Children: true,
        Father: {
          select: {
            PR_ID: true,
            PR_UNIQUE_ID: true,
            PR_FULL_NAME: true,
          },
        },
        Mother: {
          select: {
            PR_ID: true,
            PR_UNIQUE_ID: true,
            PR_FULL_NAME: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Family members fetched successfully",
      count: familyMembers.length,
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
