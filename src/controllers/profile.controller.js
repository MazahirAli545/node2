// import { PrismaClient } from "@prisma/client";
// import express from "express";
// import prisma from "../db/prismaClient.js";
// const app = express();
// // const prisma = new PrismaClient();

// async function getUserProfile(req, res) {
//   try {
//     const userId = req.userId;

//     const user = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: userId },
//       include: {
//         Profession: true,
//         City: true,
//         Children: true,
//       },
//     });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "User not found", success: false });
//     }

//     res.status(200).json({
//       message: "User data fetched successfully",
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({ message: "Something went wrong", success: false });
//   }
// }

// export default getUserProfile;
import { PrismaClient } from "@prisma/client";
import express from "express";
import prisma from "../db/prismaClient.js";
const app = express();

// async function getUserProfile(req, res) {
//   try {
//     const userId = req.userId;

//     // Get the main user data with all relationships
//     const user = await prisma.peopleRegistry.findUnique({
//       where: { PR_ID: userId },
//       include: {
//         Profession: true,
//         City: true,
//         Children: true,
//         // Include the actual relation records
//         Father: {
//           select: {
//             PR_UNIQUE_ID: true,
//           },
//         },
//         Mother: {
//           select: {
//             PR_UNIQUE_ID: true,
//           },
//         },
//         Spouse: {
//           select: {
//             PR_UNIQUE_ID: true,
//           },
//         },
//       },
//     });

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//         success: false,
//       });
//     }

//     // Transform the response to use PR_UNIQUE_ID
//     const transformedUser = {
//       ...user,
//       FatherID: user.Father?.PR_UNIQUE_ID || null,
//       MotherID: user.Mother?.PR_UNIQUE_ID || null,
//       SpouseID: user.Spouse?.PR_UNIQUE_ID || null,
//     };

//     // Remove the relation objects since we've extracted the IDs
//     delete transformedUser.Father;
//     delete transformedUser.Mother;
//     delete transformedUser.Spouse;

//     res.status(200).json({
//       message: "User data fetched successfully",
//       success: true,
//       data: transformedUser,
//     });
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     res.status(500).json({
//       message: "Something went wrong",
//       success: false,
//     });
//   }
// }
async function getUserProfile(req, res) {
  try {
    const userId = req.userId;

    // Get the main user data
    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Get all related IDs in parallel
    const [father, mother, spouse] = await Promise.all([
      user.FatherID
        ? prisma.peopleRegistry.findUnique({
            where: { PR_ID: user.FatherID },
            select: { PR_UNIQUE_ID: true },
          })
        : null,
      user.MotherID
        ? prisma.peopleRegistry.findUnique({
            where: { PR_ID: user.MotherID },
            select: { PR_UNIQUE_ID: true },
          })
        : null,
      user.SpouseID
        ? prisma.peopleRegistry.findUnique({
            where: { PR_ID: user.SpouseID },
            select: { PR_UNIQUE_ID: true },
          })
        : null,
    ]);

    // Transform the response
    const transformedUser = {
      ...user,
      FatherID: father?.PR_UNIQUE_ID || null,
      MotherID: mother?.PR_UNIQUE_ID || null,
      SpouseID: spouse?.PR_UNIQUE_ID || null,
    };

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
