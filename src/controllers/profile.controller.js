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
// const prisma = new PrismaClient();

// Helper function to convert PR_ID to PR_UNIQUE_ID
const convertIdToUniqueId = async (prId) => {
  if (!prId) return null;

  try {
    const person = await prisma.peopleRegistry.findUnique({
      where: {
        PR_ID: prId,
      },
      select: {
        PR_UNIQUE_ID: true,
      },
    });

    return person ? person.PR_UNIQUE_ID : null;
  } catch (error) {
    console.error(`Error converting PR_ID ${prId} to PR_UNIQUE_ID:`, error);
    return null;
  }
};

async function getUserProfile(req, res) {
  try {
    const userId = req.userId;

    const user = await prisma.peopleRegistry.findUnique({
      where: { PR_ID: userId },
      include: {
        Profession: true,
        City: true,
        Children: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Convert PR_ID to PR_UNIQUE_ID for father_id, mother_id, and spouse_id
    const convertedUser = { ...user };

    if (user.father_id) {
      convertedUser.father_id = await convertIdToUniqueId(user.father_id);
    }

    if (user.mother_id) {
      convertedUser.mother_id = await convertIdToUniqueId(user.mother_id);
    }

    if (user.spouse_id) {
      convertedUser.spouse_id = await convertIdToUniqueId(user.spouse_id);
    }

    res.status(200).json({
      message: "User data fetched successfully",
      success: true,
      data: convertedUser,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Something went wrong", success: false });
  }
}

export default getUserProfile;
