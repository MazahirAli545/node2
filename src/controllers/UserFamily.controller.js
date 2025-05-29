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

export const getFamilyMembersss = async (req, res) => {
  try {
    const { id, father_id, mother_id } = req.query;

    if (!id && !father_id && !mother_id) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one of: PR_ID, father_id, or mother_id",
      });
    }

    // Determine which ID to use as the base
    const baseId = id || father_id || mother_id;
    const numericId = parseInt(baseId);

    if (isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter provided",
      });
    }

    // Get the family prefix (first 3 parts of PR_UNIQUE_ID)
    const basePerson = await prisma.$queryRaw`
      SELECT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3) as familyPrefix 
      FROM PEOPLE_REGISTRY 
      WHERE PR_ID = ${numericId} 
      LIMIT 1
    `;

    if (!basePerson || !basePerson[0]?.familyPrefix) {
      return res.status(404).json({
        success: false,
        message: `Person not found or missing PR_UNIQUE_ID for ID ${numericId}`,
      });
    }

    const familyPrefix = basePerson[0].familyPrefix;

    // Build the main query to get family members
    let queryConditions = [];

    if (father_id) {
      queryConditions.push(prisma.$queryRaw`
        SELECT 
          Child.PR_ID,
          Child.PR_UNIQUE_ID,
          Child.PR_FULL_NAME,
          Child.PR_GENDER,
          Child.PR_FATHER_ID,
          Child.PR_MOTHER_ID,
          Father.PR_ID as father_PR_ID,
          Father.PR_UNIQUE_ID as father_PR_UNIQUE_ID,
          Father.PR_FULL_NAME as father_PR_FULL_NAME,
          Mother.PR_ID as mother_PR_ID,
          Mother.PR_UNIQUE_ID as mother_PR_UNIQUE_ID,
          Mother.PR_FULL_NAME as mother_PR_FULL_NAME
        FROM PEOPLE_REGISTRY Child
        LEFT JOIN PEOPLE_REGISTRY Father ON Child.PR_FATHER_ID = Father.PR_ID
        LEFT JOIN PEOPLE_REGISTRY Mother ON Child.PR_MOTHER_ID = Mother.PR_ID
        WHERE Child.PR_FATHER_ID = ${parseInt(father_id)}
      `);
    }

    if (mother_id) {
      queryConditions.push(prisma.$queryRaw`
        SELECT 
          Child.PR_ID,
          Child.PR_UNIQUE_ID,
          Child.PR_FULL_NAME,
          Child.PR_GENDER,
          Child.PR_FATHER_ID,
          Child.PR_MOTHER_ID,
          Father.PR_ID as father_PR_ID,
          Father.PR_UNIQUE_ID as father_PR_UNIQUE_ID,
          Father.PR_FULL_NAME as father_PR_FULL_NAME,
          Mother.PR_ID as mother_PR_ID,
          Mother.PR_UNIQUE_ID as mother_PR_UNIQUE_ID,
          Mother.PR_FULL_NAME as mother_PR_FULL_NAME
        FROM PEOPLE_REGISTRY Child
        LEFT JOIN PEOPLE_REGISTRY Father ON Child.PR_FATHER_ID = Father.PR_ID
        LEFT JOIN PEOPLE_REGISTRY Mother ON Child.PR_MOTHER_ID = Mother.PR_ID
        WHERE Child.PR_MOTHER_ID = ${parseInt(mother_id)}
      `);
    }

    // Always include family members by PR_UNIQUE_ID prefix
    queryConditions.push(prisma.$queryRaw`
      SELECT 
        p.PR_ID,
        p.PR_UNIQUE_ID,
        p.PR_FULL_NAME,
        p.PR_GENDER,
        p.PR_FATHER_ID,
        p.PR_MOTHER_ID,
        Father.PR_ID as father_PR_ID,
        Father.PR_UNIQUE_ID as father_PR_UNIQUE_ID,
        Father.PR_FULL_NAME as father_PR_FULL_NAME,
        Mother.PR_ID as mother_PR_ID,
        Mother.PR_UNIQUE_ID as mother_PR_UNIQUE_ID,
        Mother.PR_FULL_NAME as mother_PR_FULL_NAME
      FROM PEOPLE_REGISTRY p
      LEFT JOIN PEOPLE_REGISTRY Father ON p.PR_FATHER_ID = Father.PR_ID
      LEFT JOIN PEOPLE_REGISTRY Mother ON p.PR_MOTHER_ID = Mother.PR_ID
      WHERE p.PR_UNIQUE_ID LIKE CONCAT(${familyPrefix}, '-%') COLLATE utf8mb4_bin
      ${id ? prisma.sql`AND p.PR_ID != ${parseInt(id)}` : prisma.empty}
    `);

    // Execute all queries and merge results
    const queryResults = await Promise.all(queryConditions);
    const allMembers = queryResults.flat();

    // Remove duplicates (in case someone appears in multiple queries)
    const uniqueMembers = allMembers.filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.PR_ID === member.PR_ID)
    );

    // Get additional details for each member in a single query
    const memberIds = uniqueMembers.map((m) => m.PR_ID);

    const membersWithDetails = await prisma.peopleRegistry.findMany({
      where: { PR_ID: { in: memberIds } },
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
      count: membersWithDetails.length,
      familyMembers: membersWithDetails,
    });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
