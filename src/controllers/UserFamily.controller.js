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
    const { id, father_id, mother_id } = req.query;
    console.log("Received query params:", { id, father_id, mother_id });

    // Validation
    if (!id && !father_id && !mother_id) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one of: PR_ID, father_id, or mother_id",
      });
    }

    // Determine main ID (priority: provided id > father_id > mother_id)
    let mainId = null;
    if (id) mainId = parseInt(id);
    else if (father_id) mainId = parseInt(father_id);
    else if (mother_id) mainId = parseInt(mother_id);

    if (!mainId || isNaN(mainId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PR_ID or parent ID provided",
      });
    }

    console.log("Using mainId:", mainId);

    // Get base person and prefix
    const person = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: mainId },
      select: {
        PR_UNIQUE_ID: true,
        PR_FATHER_ID: true,
        PR_MOTHER_ID: true,
      },
    });

    if (!person?.PR_UNIQUE_ID) {
      return res.status(404).json({
        success: false,
        message: "Unable to determine base family prefix",
      });
    }

    // Extract family prefix (first 3 segments of PR_UNIQUE_ID)
    const parts = person.PR_UNIQUE_ID.split("-");
    if (parts.length < 3) {
      return res.status(404).json({
        success: false,
        message: "Invalid PR_UNIQUE_ID format",
      });
    }
    const basePrefix = `${parts[0]}-${parts[1]}-${parts[2]}`;
    console.log("Base prefix:", basePrefix);

    // Get actual father_id and mother_id from person if not provided
    const effectiveFatherId = father_id
      ? parseInt(father_id)
      : person.PR_FATHER_ID;
    const effectiveMotherId = mother_id
      ? parseInt(mother_id)
      : person.PR_MOTHER_ID;

    // Execute both queries in parallel
    const [familyByPrefix, familyByParents] = await Promise.all([
      // Query 1: Get family members by prefix match
      prisma.peopleRegistry.findMany({
        where: {
          PR_UNIQUE_ID: { startsWith: basePrefix },
          NOT: { PR_ID: mainId }, // Always exclude the main person
        },
        include: {
          Profession: true,
          City: true,
          BUSSINESS: true,
          Children: true,
          Father: { select: { PR_ID: true, PR_FULL_NAME: true } },
          Mother: { select: { PR_ID: true, PR_FULL_NAME: true } },
        },
      }),

      // Query 2: Get direct relatives (parents, siblings, children)
      prisma.peopleRegistry.findMany({
        where: {
          OR: [
            {
              PR_ID: {
                in: [effectiveFatherId, effectiveMotherId].filter(Boolean),
              },
            }, // Parents
            { PR_FATHER_ID: effectiveFatherId }, // Siblings from father
            { PR_MOTHER_ID: effectiveMotherId }, // Siblings from mother
            {
              OR: [
                { PR_FATHER_ID: mainId }, // Children
                { PR_MOTHER_ID: mainId },
              ],
            },
          ],
          NOT: { PR_ID: mainId }, // Exclude self
        },
        include: {
          Profession: true,
          City: true,
          BUSSINESS: true,
          Children: true,
          Father: { select: { PR_ID: true, PR_FULL_NAME: true } },
          Mother: { select: { PR_ID: true, PR_FULL_NAME: true } },
        },
      }),
    ]);

    console.log(
      "Prefix query results:",
      familyByPrefix.map((m) => m.PR_ID)
    );
    console.log(
      "Relatives query results:",
      familyByParents.map((m) => m.PR_ID)
    );

    // Combine and deduplicate results
    const uniqueMembers = new Map();

    // Add prefix-matched members first
    familyByPrefix.forEach((member) => {
      uniqueMembers.set(member.PR_ID, member);
    });

    // Add relatives (will overwrite if same ID exists)
    familyByParents.forEach((member) => {
      uniqueMembers.set(member.PR_ID, member);
    });

    const combinedFamily = Array.from(uniqueMembers.values());

    console.log(
      "Final combined members:",
      combinedFamily.map((m) => m.PR_ID)
    );

    return res.status(200).json({
      success: true,
      message: "Family members fetched successfully",
      count: combinedFamily.length,
      basePrefix,
      query1Count: familyByPrefix.length,
      query2Count: familyByParents.length,
      familyMembers: combinedFamily,
    });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
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
