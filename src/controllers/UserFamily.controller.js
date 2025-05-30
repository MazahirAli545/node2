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

//     // Determine the main ID for base prefix lookup (priority: father_id > id > mother_id)
//     let mainId = null;
//     if (father_id) {
//       mainId = parseInt(father_id);
//     } else if (id) {
//       mainId = parseInt(id);
//     } else if (mother_id) {
//       mainId = parseInt(mother_id);
//     }

//     if (!mainId || isNaN(mainId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_ID or parent ID provided for basePrefix lookup",
//       });
//     }

//     // Get basePrefix using mainId (Query 1 equivalent)
//     const person = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: mainId },
//       select: { PR_UNIQUE_ID: true },
//     });

//     if (!person?.PR_UNIQUE_ID) {
//       return res.status(404).json({
//         success: false,
//         message: "Unable to determine base family prefix",
//       });
//     }

//     const parts = person.PR_UNIQUE_ID.split("-");
//     if (parts.length < 3) {
//       return res.status(404).json({
//         success: false,
//         message: "Invalid PR_UNIQUE_ID format",
//       });
//     }

//     const basePrefix = `${parts[0]}-${parts[1]}-${parts[2]}`;

//     let familyByPrefix = [];
//     let familyByParents = [];

//     // Execute Query 1 (all family members with same base prefix)
//     familyByPrefix = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_UNIQUE_ID: { startsWith: `${basePrefix}` },
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

//     // Execute Query 2 only if father_id or mother_id is provided
//     // familyByParents = [];
//     if (father_id || mother_id) {
//       const parentConditions = [];

//       if (father_id && !isNaN(parseInt(father_id))) {
//         parentConditions.push({ PR_FATHER_ID: parseInt(father_id) });
//       }

//       if (mother_id && !isNaN(parseInt(mother_id))) {
//         parentConditions.push({ PR_MOTHER_ID: parseInt(mother_id) });
//       }

//       familyByParents = await prisma.peopleRegistry.findMany({
//         where: {
//           OR: parentConditions,
//           ...(id && { NOT: { PR_ID: parseInt(id) } }),
//         },
//         include: {
//           Profession: true,
//           City: true,
//           BUSSINESS: true,
//           Children: true,
//           Father: {
//             select: {
//               PR_ID: true,
//               PR_UNIQUE_ID: true,
//               PR_FULL_NAME: true,
//             },
//           },
//           Mother: {
//             select: {
//               PR_ID: true,
//               PR_UNIQUE_ID: true,
//               PR_FULL_NAME: true,
//             },
//           },
//         },
//       });
//     }

//     // Combine results and remove duplicates
//     const combinedFamily = [...familyByPrefix];
//     const uniqueIds = new Set(familyByPrefix.map((m) => m.PR_ID));

//     for (const member of familyByParents) {
//       if (!uniqueIds.has(member.PR_ID)) {
//         combinedFamily.push(member);
//         uniqueIds.add(member.PR_ID);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Family members fetched successfully",
//       count: combinedFamily.length,
//       basePrefix,
//       query1Count: familyByPrefix.length,
//       query2Count: familyByParents.length,
//       familyMembers: combinedFamily,
//     });
//   } catch (error) {
//     console.error("Error fetching family members:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };
import prisma from "../db/prismaClient.js";

export const getFamilyMembersss = async (req, res) => {
  try {
    const { id } = req.query;

    // More detailed parameter validation
    if (!id) {
      console.error("Error: No PR_ID provided in request");
      return res.status(400).json({
        success: false,
        message: "Please provide a valid PR_ID in the query parameters",
        example: "/api/family-members?id=841",
      });
    }

    const mainId = parseInt(id);
    if (isNaN(mainId)) {
      console.error(`Error: Invalid PR_ID provided: ${id}`);
      return res.status(400).json({
        success: false,
        message: "The provided PR_ID must be a valid number",
        received: id,
      });
    }

    console.log(`Fetching family for PR_ID: ${mainId}`);

    // Get the person's details including parents
    const person = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: mainId },
      select: {
        PR_UNIQUE_ID: true,
        PR_FATHER_ID: true,
        PR_MOTHER_ID: true,
        PR_FULL_NAME: true,
      },
    });

    if (!person) {
      console.error(`Error: Person with PR_ID ${mainId} not found`);
      return res.status(404).json({
        success: false,
        message: "Person not found in database",
        PR_ID: mainId,
      });
    }

    console.log(`Found person: ${person.PR_FULL_NAME} (${mainId})`);

    // Extract family prefix (first 3 segments)
    const parts = person.PR_UNIQUE_ID?.split("-");
    if (!parts || parts.length < 3) {
      console.error(`Error: Invalid PR_UNIQUE_ID format for ${mainId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid family identifier format",
        PR_UNIQUE_ID: person.PR_UNIQUE_ID,
      });
    }

    const familyPrefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
    console.log(`Family prefix: ${familyPrefix}`);

    // Prepare parent IDs (filter out null/undefined)
    const parentIds = [person.PR_FATHER_ID, person.PR_MOTHER_ID].filter(
      (id) => id
    );

    // Get all family members in a single query
    const familyMembers = await prisma.peopleRegistry.findMany({
      where: {
        OR: [
          // Same family prefix (siblings)
          { PR_UNIQUE_ID: { startsWith: familyPrefix } },
          // Direct parents
          { PR_ID: { in: parentIds } },
          // People with same parents (siblings)
          { PR_FATHER_ID: person.PR_FATHER_ID },
          { PR_MOTHER_ID: person.PR_MOTHER_ID },
        ],
        NOT: { PR_ID: mainId }, // Exclude self
      },
      include: {
        Profession: true,
        City: true,
        BUSSINESS: true,
        Father: { select: { PR_FULL_NAME: true } },
        Mother: { select: { PR_FULL_NAME: true } },
      },
      orderBy: { PR_ID: "asc" },
    });

    console.log(`Found ${familyMembers.length} family members`);

    return res.status(200).json({
      success: true,
      message: "Family members fetched successfully",
      count: familyMembers.length,
      mainMember: {
        PR_ID: mainId,
        name: person.PR_FULL_NAME,
      },
      familyMembers,
    });
  } catch (error) {
    console.error("Error in getFamilyMembersss:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching family members",
      error: error.message,
    });
  }
};

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

//     // Determine the main ID for base prefix lookup (priority: father_id > id > mother_id)
//     let mainId = father_id || id || mother_id;

//     const mainIdInt = parseInt(mainId);
//     if (!mainIdInt || isNaN(mainIdInt)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_ID or parent ID provided for basePrefix lookup",
//       });
//     }

//     // Get basePrefix using PR_UNIQUE_ID
//     const person = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: mainIdInt },
//       select: { PR_UNIQUE_ID: true },
//     });

//     if (!person?.PR_UNIQUE_ID) {
//       return res.status(404).json({
//         success: false,
//         message: "Unable to determine base family prefix",
//       });
//     }

//     const parts = person.PR_UNIQUE_ID.split("-");
//     if (parts.length < 3) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_UNIQUE_ID format",
//       });
//     }

//     const basePrefix = `${parts[0]}-${parts[1]}-${parts[2]}`;

//     // Query 1: Family members by prefix
//     const familyByPrefix = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_UNIQUE_ID: {
//           startsWith: `${basePrefix}`,
//         },
//         ...(id && { NOT: { PR_ID: parseInt(id) } }),
//       },
//       include: {
//         Profession: true,
//         City: true,
//         BUSSINESS: true,
//         Children: true,
//         Father: {
//           select: { PR_ID: true, PR_UNIQUE_ID: true, PR_FULL_NAME: true },
//         },
//         Mother: {
//           select: { PR_ID: true, PR_UNIQUE_ID: true, PR_FULL_NAME: true },
//         },
//       },
//     });

//     // Query 2: Children of the given father or mother
//     let familyByParents = [];
//     const parentConditions = [];

//     if (father_id) parentConditions.push({ PR_FATHER_ID: parseInt(father_id) });
//     if (mother_id) parentConditions.push({ PR_MOTHER_ID: parseInt(mother_id) });

//     if (parentConditions.length > 0) {
//       familyByParents = await prisma.peopleRegistry.findMany({
//         where: {
//           OR: parentConditions,
//           ...(id && { NOT: { PR_ID: parseInt(id) } }),
//         },
//         include: {
//           Profession: true,
//           City: true,
//           BUSSINESS: true,
//           Children: true,
//           Father: {
//             select: { PR_ID: true, PR_UNIQUE_ID: true, PR_FULL_NAME: true },
//           },
//           Mother: {
//             select: { PR_ID: true, PR_UNIQUE_ID: true, PR_FULL_NAME: true },
//           },
//         },
//       });
//     }

//     // Combine both queries and remove duplicates
//     const combinedFamily = [...familyByPrefix];
//     const seenIds = new Set(combinedFamily.map((m) => m.PR_ID));

//     for (const member of familyByParents) {
//       if (!seenIds.has(member.PR_ID)) {
//         combinedFamily.push(member);
//         seenIds.add(member.PR_ID);
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Family members fetched successfully",
//       count: combinedFamily.length,
//       basePrefix,
//       query1Count: familyByPrefix.length,
//       query2Count: familyByParents.length,
//       familyMembers: combinedFamily,
//     });
//   } catch (error) {
//     console.error("Error fetching family members:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };
