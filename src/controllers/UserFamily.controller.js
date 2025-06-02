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
// import prisma from "../db/prismaClient.js";

// export const getFamilyMembersss = async (req, res) => {
//   try {
//     const { id, father_id, mother_id } = req.query;
//     console.log("Received query params:", { id, father_id, mother_id });

//     // Validation
//     if (!id && !father_id && !mother_id) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide at least one of: PR_ID, father_id, or mother_id",
//       });
//     }

//     // Determine main ID
//     let mainId = null;
//     if (father_id) mainId = parseInt(father_id);
//     else if (id) mainId = parseInt(id);
//     else if (mother_id) mainId = parseInt(mother_id);

//     if (!mainId || isNaN(mainId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid PR_ID or parent ID provided",
//       });
//     }

//     console.log("Using mainId:", mainId);

//     // Get base prefix
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
//     console.log("Base prefix:", basePrefix);

//     // Execute queries
//     const queries = {
//       prefixQuery: {
//         where: {
//           PR_UNIQUE_ID: { startsWith: basePrefix },
//           ...(id && { NOT: { PR_ID: parseInt(id) } }),
//         },
//         include: {
//           Profession: true,
//           City: true,
//           BUSSINESS: true,
//           Children: true,
//           Father: true,
//           Mother: true,
//         },
//       },
//       parentsQuery: {
//         where: {
//           OR: [
//             ...(father_id ? [{ PR_FATHER_ID: parseInt(father_id) }] : []),
//             ...(mother_id ? [{ PR_MOTHER_ID: parseInt(mother_id) }] : []),
//           ],
//           ...(id && { NOT: { PR_ID: parseInt(id) } }),
//         },
//         include: {
//           Profession: true,
//           City: true,
//           BUSSINESS: true,
//           Children: true,
//           Father: true,
//           Mother: true,
//         },
//       },
//     };

//     console.log(
//       "Query 1 conditions:",
//       JSON.stringify(queries.prefixQuery.where)
//     );
//     console.log(
//       "Query 2 conditions:",
//       JSON.stringify(queries.parentsQuery.where)
//     );

//     const [familyByPrefix, familyByParents] = await Promise.all([
//       prisma.peopleRegistry.findMany(queries.prefixQuery),
//       father_id || mother_id
//         ? prisma.peopleRegistry.findMany(queries.parentsQuery)
//         : Promise.resolve([]),
//     ]);

//     console.log(
//       "Query 1 results:",
//       familyByPrefix.map((m) => ({ id: m.PR_ID, name: m.PR_FULL_NAME }))
//     );
//     console.log(
//       "Query 2 results:",
//       familyByParents.map((m) => ({ id: m.PR_ID, name: m.PR_FULL_NAME }))
//     );

//     // Combine results - NEW APPROACH
//     const combinedFamily = [];
//     const seenIds = new Set();

//     // First add all prefix results
//     familyByPrefix.forEach((member) => {
//       if (!seenIds.has(member.PR_ID)) {
//         seenIds.add(member.PR_ID);
//         combinedFamily.push(member);
//       }
//     });

//     // Then add parent results that aren't already included
//     familyByParents.forEach((member) => {
//       if (!seenIds.has(member.PR_ID)) {
//         seenIds.add(member.PR_ID);
//         combinedFamily.push(member);
//       }
//     });

//     console.log(
//       "Final combined family IDs:",
//       combinedFamily.map((m) => m.PR_ID)
//     );

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

    const parsedId = id ? parseInt(id) : null;
    const parsedFatherId = father_id ? parseInt(father_id) : null;
    const parsedMotherId = mother_id ? parseInt(mother_id) : null;

    if (!parsedId && !parsedFatherId && !parsedMotherId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one of: PR_ID, father_id, or mother_id",
      });
    }

    // if (!id && !father_id && !mother_id) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "Please provide at least one of: PR_ID, father_id, or mother_id",
    //   });
    // }

    // // Step 1: Fetch PR_UNIQUE_ID of father, mother, or id
    // const idsToCheck = [id, father_id, mother_id].filter(Boolean).map(Number);
    // const people = await prisma.peopleRegistry.findMany({
    //   where: { PR_ID: { in: idsToCheck } },
    //   select: { PR_ID: true, PR_UNIQUE_ID: true },
    // });

    // // Step 2: Extract all prefixes (SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3))
    // const basePrefixes = new Set();
    // people.forEach((p) => {
    //   const parts = p.PR_UNIQUE_ID?.split("-");
    //   if (parts?.length >= 3) {
    //     basePrefixes.add(`${parts[0]}-${parts[1]}-${parts[2]}`);
    //   }
    // });

    // if (basePrefixes.size === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Unable to determine family base prefix from given IDs",
    //   });
    // }

    // // Step 3: Fetch by basePrefix (common family group)
    // const prefixQuery = await prisma.peopleRegistry.findMany({
    //   where: {
    //     OR: [...basePrefixes].map((prefix) => ({
    //       PR_UNIQUE_ID: { startsWith: `${prefix}-` },
    //     })),
    //     ...(id && { NOT: { PR_ID: parseInt(id) } }),
    //   },
    //   include: {
    //     Profession: true,
    //     City: true,
    //     BUSSINESS: true,
    //     Children: true,
    //     Father: true,
    //     Mother: true,
    //   },
    // });

    // // Step 4: Fetch by parent ID (father/mother)
    // const parentConditions = [];
    // if (father_id) parentConditions.push({ PR_FATHER_ID: parseInt(father_id) });
    // if (mother_id) parentConditions.push({ PR_MOTHER_ID: parseInt(mother_id) });

    // const parentsQuery = parentConditions.length
    //   ? await prisma.peopleRegistry.findMany({
    //       where: {
    //         OR: parentConditions,
    //         ...(id && { NOT: { PR_ID: parseInt(id) } }),
    //       },
    //       include: {
    //         Profession: true,
    //         City: true,
    //         BUSSINESS: true,
    //         Children: true,
    //         Father: true,
    //         Mother: true,
    //       },
    //     })
    //   : [];

    // // Step 5: Merge both results with unique PR_IDs
    // const seenIds = new Set();
    // const combinedFamily = [];

    // console.log(prefixQuery, parentsQuery, "FAMILY");

    // [...prefixQuery, ...parentsQuery].forEach((member) => {
    //   if (!seenIds.has(member.PR_ID)) {
    //     seenIds.add(member.PR_ID);
    //     combinedFamily.push(member);
    //   }
    // });

    // Query 1: Get all PR_UNIQUE_IDs with the same prefix as PR_ID = prId1
    const idsWithPrefix = await prisma.$queryRawUnsafe(`
      SELECT * 
      FROM PEOPLE_REGISTRY 
      WHERE PR_UNIQUE_ID LIKE CONCAT(
        (
          SELECT DISTINCT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3) 
          FROM PEOPLE_REGISTRY 
          WHERE PR_ID = ${parsedId} 
          LIMIT 1
        ), '-%'
      );
    `);

    // Query 2: Get children with their parents where Father/Mother ID = prId1/prId2 or same prefix
    const familyDetails = await prisma.$queryRawUnsafe(`
      SELECT 
        Child.*,
        Father.PR_UNIQUE_ID AS Father_ID,
        Father.PR_FULL_NAME AS Father_Name,
        Mother.PR_UNIQUE_ID AS Mother_ID,
        Mother.PR_FULL_NAME AS Mother_Name
      FROM PEOPLE_REGISTRY Child
      LEFT JOIN PEOPLE_REGISTRY Father ON Child.PR_FATHER_ID = Father.PR_ID
      LEFT JOIN PEOPLE_REGISTRY Mother ON Child.PR_MOTHER_ID = Mother.PR_ID
      WHERE 
        Child.PR_FATHER_ID = ${parsedFatherId}
        OR Child.PR_MOTHER_ID = ${parsedMotherId}
        OR SUBSTRING_INDEX(Child.PR_UNIQUE_ID, '-', 3) = (
          SELECT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3)
          FROM PEOPLE_REGISTRY
          WHERE PR_ID = ${parsedFatherId}
          LIMIT 1
        )
        OR SUBSTRING_INDEX(Child.PR_UNIQUE_ID, '-', 3) = (
          SELECT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3)
          FROM PEOPLE_REGISTRY
          WHERE PR_ID = ${parsedMotherId}
          LIMIT 1
        );
    `);

    const combinedFamily = [...idsWithPrefix, ...familyDetails];
    console.log(combinedFamily, "combinedFamily");
    console.log(idsWithPrefix, familyDetails, "combinedFamily2");
    return res.status(200).json({
      success: true,
      message: "Family members fetched successfully",
      count:
        familyDetails.length > 0
          ? parseInt(familyDetails.length) + parseInt(idsWithPrefix.length)
          : idsWithPrefix.length,
      basePrefixes: [], //Array.from(basePrefixes),
      query1Count: idsWithPrefix.length,
      query2Count: familyDetails.length,
      familyMembers: familyDetails.length > 0 ? familyDetails : idsWithPrefix,
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
