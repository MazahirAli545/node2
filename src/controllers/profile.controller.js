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

async function getUserProfile(req, res) {
  try {
    const userId = req.userId;

    // First get the main user data
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

    // Create a copy of the user object to modify
    const responseData = { ...user };

    // Function to get PR_UNIQUE_ID from PR_ID
    const getUniqueId = async (prId) => {
      if (!prId) return null;
      const person = await prisma.peopleRegistry.findUnique({
        where: { PR_ID: prId },
        select: { PR_UNIQUE_ID: true },
      });
      return person?.PR_UNIQUE_ID || null;
    };

    // Replace PR_IDs with PR_UNIQUE_IDs for relationships
    responseData.FatherID = await getUniqueId(user.FatherID);
    responseData.MotherID = await getUniqueId(user.MotherID);
    responseData.SpouseID = await getUniqueId(user.SpouseID);

    // Also convert Children's PR_ID to PR_UNIQUE_ID if needed
    if (responseData.Children && responseData.Children.length > 0) {
      responseData.Children = await Promise.all(
        responseData.Children.map(async (child) => {
          const uniqueId = await getUniqueId(child.PR_ID);
          return {
            ...child,
            PR_ID: uniqueId, // Replace PR_ID with PR_UNIQUE_ID for each child
          };
        })
      );
    }

    res.status(200).json({
      message: "User data fetched successfully",
      success: true,
      data: responseData,
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
