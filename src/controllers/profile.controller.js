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

    // 1. First get the main user with all relationships
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

    // 2. Prepare an array of all related PR_IDs we need to convert
    const idsToConvert = [];
    if (user.FatherID) idsToConvert.push(user.FatherID);
    if (user.MotherID) idsToConvert.push(user.MotherID);
    if (user.SpouseID) idsToConvert.push(user.SpouseID);

    // 3. Fetch all unique IDs in a single query
    const relatedPeople = await prisma.peopleRegistry.findMany({
      where: {
        PR_ID: { in: idsToConvert },
      },
      select: {
        PR_ID: true,
        PR_UNIQUE_ID: true,
      },
    });

    // 4. Create a mapping dictionary for quick lookup
    const idMap = {};
    relatedPeople.forEach((person) => {
      idMap[person.PR_ID] = person.PR_UNIQUE_ID;
    });

    // 5. Construct the final response with PR_UNIQUE_ID values
    const responseData = {
      ...user,
      FatherID: user.FatherID ? idMap[user.FatherID] : null,
      MotherID: user.MotherID ? idMap[user.MotherID] : null,
      SpouseID: user.SpouseID ? idMap[user.SpouseID] : null,
      // Keep original Children data (modify if you need to convert their IDs too)
      Children: user.Children,
    };

    // 6. Send the transformed response
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
