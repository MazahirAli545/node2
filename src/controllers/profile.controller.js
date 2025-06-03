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

    // Collect all related PR_IDs that need conversion
    const relatedIds = [
      user.FatherID,
      user.MotherID,
      user.SpouseID,
      ...(user.Children?.map((child) => child.PR_ID) || []),
    ].filter((id) => id); // Remove null/undefined

    // Fetch all unique IDs in one query
    const relatedPeople = await prisma.peopleRegistry.findMany({
      where: {
        PR_ID: { in: relatedIds },
      },
      select: {
        PR_ID: true,
        PR_UNIQUE_ID: true,
      },
    });

    // Create a mapping of PR_ID to PR_UNIQUE_ID
    const idToUniqueIdMap = new Map(
      relatedPeople.map((person) => [person.PR_ID, person.PR_UNIQUE_ID])
    );

    // Create response data
    const responseData = {
      ...user,
      FatherID: user.FatherID ? idToUniqueIdMap.get(user.FatherID) : null,
      MotherID: user.MotherID ? idToUniqueIdMap.get(user.MotherID) : null,
      SpouseID: user.SpouseID ? idToUniqueIdMap.get(user.SpouseID) : null,
      Children:
        user.Children?.map((child) => ({
          ...child,
          PR_ID: idToUniqueIdMap.get(child.PR_ID) || child.PR_ID,
        })) || [],
    };

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
