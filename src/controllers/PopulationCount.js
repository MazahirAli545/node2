import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";

export const getUserStats = async (req, res) => {
  try {
    // 1. Total number of users
    const totalUsers = await prisma.peopleRegistry.count();

    // 2. Fetch all users
    const allUsers = await prisma.peopleRegistry.findMany({
      select: {
        PR_ID: true,
        PR_FULL_NAME: true,
        PR_MOBILE_NO: true,
      },
    });

    // 3. Group users by mobile number
    const groupedFamilies = {};
    for (const user of allUsers) {
      const mobile = user.PR_MOBILE_NO;
      if (!groupedFamilies[mobile]) {
        groupedFamilies[mobile] = [];
      }
      groupedFamilies[mobile].push({
        id: user.PR_ID,
        name: user.PR_FULL_NAME,
      });
    }

    // 4. Only include mobile numbers with more than 1 member
    const families = Object.entries(groupedFamilies)
      .filter(([_, members]) => members.length > 1)
      .map(([mobileNumber, members]) => ({
        mobileNumber,
        membersCount: members.length,
        members,
      }));

    const familyCount = families.length;

    // Store the stats in database
    await prisma.populationStats.create({
      data: {
        totalPopulation: totalUsers,
        familyCount: familyCount,
      },
    });

    res.json({
      totalPopulation: totalUsers,
      familyCount: familyCount,
      families,
      message: "Statistics saved to database",
    });
  } catch (error) {
    console.error("Error generating user stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default getUserStats;
