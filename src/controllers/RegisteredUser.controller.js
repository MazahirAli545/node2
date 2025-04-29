import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient";
// const prisma = new PrismaClient();

export const getAllUsersBasicDetails = async (req, res) => {
  try {
    const users = await prisma.peopleRegistry.findMany({
      select: {
        PR_FULL_NAME: true,
        PR_MOBILE_NO: true,
      },
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Something went wrong",
      success: false,
    });
  }
};
