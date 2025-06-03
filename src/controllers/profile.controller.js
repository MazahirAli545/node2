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

    // Prepare an object to store the final response data
    const responseData = {
      ...user,
      Father: null,
      Mother: null,
      Spouse: null,
    };

    // Remove the ID fields that we'll replace with objects
    delete responseData.FatherID;
    delete responseData.MotherID;
    delete responseData.SpouseID;

    // Fetch father details if FatherID exists
    if (user.FatherID) {
      const father = await prisma.peopleRegistry.findUnique({
        where: { PR_ID: user.FatherID },
        select: { PR_UNIQUE_ID: true },
      });
      if (father) {
        responseData.Father = { PR_UNIQUE_ID: father.PR_UNIQUE_ID };
      }
    }

    // Fetch mother details if MotherID exists
    if (user.MotherID) {
      const mother = await prisma.peopleRegistry.findUnique({
        where: { PR_ID: user.MotherID },
        select: { PR_UNIQUE_ID: true },
      });
      if (mother) {
        responseData.Mother = { PR_UNIQUE_ID: mother.PR_UNIQUE_ID };
      }
    }

    // Fetch spouse details if SpouseID exists
    if (user.SpouseID) {
      const spouse = await prisma.peopleRegistry.findUnique({
        where: { PR_ID: user.SpouseID },
        select: { PR_UNIQUE_ID: true },
      });
      if (spouse) {
        responseData.Spouse = { PR_UNIQUE_ID: spouse.PR_UNIQUE_ID };
      }
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
