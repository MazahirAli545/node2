import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";

export const getUserStats = async (req, res) => {
  try {
    // 1. Get all statistics in parallel for better performance
    const [
      totalPopulation,
      genderCounts,
      familyCount,
      familiesWith2Children,
      familiesWithMoreThan2Children,
    ] = await Promise.all([
      // Total population count
      prisma.peopleRegistry.count(),

      // Male/Female counts
      prisma.peopleRegistry.groupBy({
        by: ["PR_GENDER"],
        _count: { PR_GENDER: true },
        where: {
          PR_GENDER: { not: null },
        },
      }),

      // Family count (mobile numbers with >1 members)
      prisma.peopleRegistry
        .groupBy({
          by: ["PR_MOBILE_NO"],
          _count: { PR_MOBILE_NO: true },
          having: { PR_MOBILE_NO: { _count: { gt: 1 } } },
        })
        .then((results) => results.length),

      // Families with exactly 2 children
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM (
          SELECT PR_MOBILE_NO 
          FROM PEOPLE_REGISTRY
          GROUP BY PR_MOBILE_NO
          HAVING COUNT(*) = 2
        ) as families
      `.then((result) => Number(result[0]?.count || 0)),

      // Families with more than 2 children
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM (
          SELECT PR_MOBILE_NO 
          FROM PEOPLE_REGISTRY
          GROUP BY PR_MOBILE_NO
          HAVING COUNT(*) > 2
        ) as families
      `.then((result) => Number(result[0]?.count || 0)),
    ]);

    // Format gender counts
    const maleCount =
      genderCounts.find((g) => g.PR_GENDER === "M")?._count?.PR_GENDER || 0;
    const femaleCount =
      genderCounts.find((g) => g.PR_GENDER === "F")?._count?.PR_GENDER || 0;
    const otherGenderCount = genderCounts
      .filter((g) => !["M", "F"].includes(g.PR_GENDER))
      .reduce((sum, g) => sum + g._count.PR_GENDER, 0);

    res.json({
      totalPopulation,
      genderDistribution: {
        male: maleCount,
        female: femaleCount,
        other: otherGenderCount,
      },
      familyCount,
      childrenDistribution: {
        familiesWith2Children,
        familiesWithMoreThan2Children,
      },
    });
  } catch (error) {
    console.error("Error generating population statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export default getUserStats;

export default getUserStats;
