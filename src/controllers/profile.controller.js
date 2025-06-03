// import { PrismaClient } from "@prisma/client";
// import express from "express";
// import prisma from "../db/prismaClient.js";
// const app = express();
// // const prisma = new PrismaClient();

// // async function getUserProfile(req, res) {
// //   try {
// //     const userId = req.userId;

// //     const user = await prisma.peopleRegistry.findUnique({
// //       where: { PR_ID: userId },
// //       include: {
// //         Profession: true,
// //         City: true,
// //         Children: true,
// //       },
// //     });

// //     if (!user) {
// //       return res
// //         .status(404)
// //         .json({ message: "User not found", success: false });
// //     }

// //     res.status(200).json({
// //       message: "User data fetched successfully",
// //       success: true,
// //       data: user,
// //     });
// //   } catch (error) {
// //     console.error("Error fetching user data:", error);
// //     res.status(500).json({ message: "Something went wrong", success: false });
// //   }
// // }

// // export default getUserProfile;

// async function getUserProfile(req, res) {
//   try {
//     const userId = req.userId;

//     // Fetch the user with related data
//     const user = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: userId },
//       include: {
//         Profession: true,
//         City: true,
//         Children: true,
//         // Include relations to get their PR_UNIQUE_ID
//         Father: {
//           select: {
//             PR_UNIQUE_ID: true
//           }
//         },
//         Mother: {
//           select: {
//             PR_UNIQUE_ID: true
//           }
//         },
//         Spouse: {
//           select: {
//             PR_UNIQUE_ID: true
//           }
//         }
//       },
//     });

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//         success: false
//       });
//     }

//     // Transform the response to replace PR_ID references with PR_UNIQUE_ID
//     const transformedUser = {
//       ...user,
//       father_id: user.Father?.PR_UNIQUE_ID || null,
//       mother_id: user.Mother?.PR_UNIQUE_ID || null,
//       spouse_id: user.Spouse?.PR_UNIQUE_ID || null,
//       // Remove the nested relation objects if not needed
//       Father: undefined,
//       Mother: undefined,
//       Spouse: undefined
//     };

//     res.status(200).json({
//       message: "User data fetched successfully",
//       success: true,
//       data: transformedUser,
//     });
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({
//       message: "Something went wrong",
//       success: false
//     });
//   }
// }

// export default getUserProfile;

import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient.js";
const app = express();

async function getUserProfile(req, res) {
  try {
    const userId = req.userId;

    // Fetch the user with related data
    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
        // Include relations to get their PR_UNIQUE_ID
        Father: {
          select: {
            PR_UNIQUE_ID: true,
          },
        },
        Mother: {
          select: {
            PR_UNIQUE_ID: true,
          },
        },
        Spouse: {
          select: {
            PR_UNIQUE_ID: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Transform the response to replace PR_ID references with PR_UNIQUE_ID
    const transformedUser = {
      ...user,
      father_id: user.Father?.PR_UNIQUE_ID || null, // Replace with PR_UNIQUE_ID
      mother_id: user.Mother?.PR_UNIQUE_ID || null, // Replace with PR_UNIQUE_ID
      spouse_id: user.Spouse?.PR_UNIQUE_ID || null, // Replace with PR_UNIQUE_ID
      // Remove the nested relation objects
      Father: undefined,
      Mother: undefined,
      Spouse: undefined,
    };

    // Explicitly remove the original ID fields if they exist
    delete transformedUser.father_PR_ID;
    delete transformedUser.mother_PR_ID;
    delete transformedUser.spouse_PR_ID;

    res.status(200).json({
      message: "User data fetched successfully",
      success: true,
      data: transformedUser,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
}

export default getUserProfile;
