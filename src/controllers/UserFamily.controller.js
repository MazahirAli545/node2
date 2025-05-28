import prisma from "../db/prismaClient.js";

// export const getFamilyMembersss = async (req, res) => {
//   try {
//     const { id, father_id, mother_id } = req.query;

//     // If no parameters provided
//     if (!id && !father_id && !mother_id) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Please provide at least one of: PR_ID, father_id, or mother_id",
//       });
//     }

//     let baseUniqueId = null;

//     // Priority 1: If father_id is provided
//     if (father_id) {
//       const fatherId = parseInt(father_id);
//       if (isNaN(fatherId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid father_id provided",
//         });
//       }

//       const father = await prisma.peopleRegistry.findFirst({
//         where: {
//           OR: [{ PR_ID: fatherId }, { PR_FATHER_ID: fatherId }],
//         },
//         select: { PR_UNIQUE_ID: true },
//       });

//       if (father) {
//         const parts = father.PR_UNIQUE_ID.split("-");
//         if (parts.length >= 3) {
//           baseUniqueId = `${parts[0]}-${parts[1]}-${parts[2]}`;
//         }
//       }
//     }

//     // Priority 2: If mother_id is provided and we haven't found a baseUniqueId yet
//     if (!baseUniqueId && mother_id) {
//       const motherId = parseInt(mother_id);
//       if (isNaN(motherId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid mother_id provided",
//         });
//       }

//       const mother = await prisma.peopleRegistry.findFirst({
//         where: {
//           OR: [{ PR_ID: motherId }, { PR_MOTHER_ID: motherId }],
//         },
//         select: { PR_UNIQUE_ID: true },
//       });

//       if (mother) {
//         const parts = mother.PR_UNIQUE_ID.split("-");
//         if (parts.length >= 3) {
//           baseUniqueId = `${parts[0]}-${parts[1]}-${parts[2]}`;
//         }
//       }
//     }

//     // Priority 3: If id is provided and we haven't found a baseUniqueId yet
//     if (!baseUniqueId && id) {
//       const prId = parseInt(id);
//       if (isNaN(prId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid PR_ID provided",
//         });
//       }

//       const person = await prisma.peopleRegistry.findUnique({
//         where: { PR_ID: prId },
//         select: { PR_UNIQUE_ID: true },
//       });

//       if (person) {
//         const parts = person.PR_UNIQUE_ID.split("-");
//         if (parts.length >= 3) {
//           baseUniqueId = `${parts[0]}-${parts[1]}-${parts[2]}`;
//         }
//       }
//     }

//     if (!baseUniqueId) {
//       return res.status(404).json({
//         success: false,
//         message: "No valid family identifier found",
//       });
//     }

//     // Find all family members
//     const familyMembers = await prisma.peopleRegistry.findMany({
//       where: {
//         PR_UNIQUE_ID: {
//           startsWith: baseUniqueId,
//         },
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
//       baseUniqueId,
//       familyMembers,
//     });
//   } catch (error) {
//     console.error("Error fetching family members:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

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

    // Validate IDs
    const ids = [];
    if (father_id) {
      const fid = parseInt(father_id);
      if (isNaN(fid)) throw new Error("Invalid father_id");
      ids.push(fid);
    }
    if (mother_id) {
      const mid = parseInt(mother_id);
      if (isNaN(mid)) throw new Error("Invalid mother_id");
      ids.push(mid);
    }
    if (id) {
      const pid = parseInt(id);
      if (isNaN(pid)) throw new Error("Invalid id");
      ids.push(pid);
    }

    // Execute raw query
    const familyMembers = await prisma.$queryRaw`
      SELECT p.* 
      FROM PEOPLE_REGISTRY p
      WHERE p.PR_UNIQUE_ID LIKE CONCAT(
        (SELECT DISTINCT SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 3) 
         FROM PEOPLE_REGISTRY 
         WHERE PR_ID IN (${Prisma.join(ids)}) 
         OR PR_FATHER_ID IN (${Prisma.join(ids)})
         OR PR_MOTHER_ID IN (${Prisma.join(ids)})
         LIMIT 1
        ), '-%'
      ) COLLATE utf8mb4_bin
    `;

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
