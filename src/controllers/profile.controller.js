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

async function getUserProfile(req, res) {
  try {
    const userId = req.userId;
    console.log("Fetching profile for user ID:", userId);

    // 1. Fetch main user data
    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    console.log("Original user data:", {
      PR_ID: user.PR_ID,
      FatherID: user.FatherID,
      MotherID: user.MotherID,
      SpouseID: user.SpouseID,
    });

    // 2. Prepare promises for all ID conversions
    const conversionPromises = {
      father: user.FatherID
        ? convertIdToUniqueId(user.FatherID)
        : Promise.resolve(null),
      mother: user.MotherID
        ? convertIdToUniqueId(user.MotherID)
        : Promise.resolve(null),
      spouse: user.SpouseID
        ? convertIdToUniqueId(user.SpouseID)
        : Promise.resolve(null),
    };

    // 3. Wait for all conversions to complete
    const convertedIds = await Promise.all([
      conversionPromises.father,
      conversionPromises.mother,
      conversionPromises.spouse,
    ]);

    console.log("Converted IDs:", {
      father: convertedIds[0],
      mother: convertedIds[1],
      spouse: convertedIds[2],
    });

    // 4. Build the final response
    const responseData = {
      ...user,
      FatherID: convertedIds[0],
      MotherID: convertedIds[1],
      SpouseID: convertedIds[2],
    };

    console.log("Final response data:", {
      FatherID: responseData.FatherID,
      MotherID: responseData.MotherID,
      SpouseID: responseData.SpouseID,
    });

    res.status(200).json({
      message: "User data fetched successfully",
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
}

// Helper function to convert PR_ID to PR_UNIQUE_ID
async function convertIdToUniqueId(prId) {
  try {
    const person = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: prId },
      select: { PR_UNIQUE_ID: true },
    });
    return person?.PR_UNIQUE_ID || null;
  } catch (error) {
    console.error(`Error converting ID ${prId}:`, error);
    return null;
  }
}

export default getUserProfile;
