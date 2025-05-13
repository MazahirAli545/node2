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
      childrenCount, // New count for children <= 18
    ] = await Promise.all([
      // Total population count
      prisma.peopleRegistry.count(),

      // Male/Female counts
      prisma.peopleRegistry.groupBy({
        by: ["PR_GENDER"],
        _count: { PR_GENDER: true },
        where: {
          PR_GENDER: { in: ["M", "F"] }, // Only count M and F
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

      // Count of children aged 18 or younger
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM child
        WHERE TIMESTAMPDIFF(YEAR, dob, CURDATE()) <= 18
      `.then((result) => Number(result[0]?.count || 0)),
    ]);

    // Calculate gender percentages
    const maleCount =
      genderCounts.find((g) => g.PR_GENDER === "M")?._count?.PR_GENDER || 0;
    const femaleCount =
      genderCounts.find((g) => g.PR_GENDER === "F")?._count?.PR_GENDER || 0;
    const totalGenderCount = maleCount + femaleCount;

    const malePercentage =
      totalGenderCount > 0
        ? Math.round((maleCount / totalGenderCount) * 100)
        : 0;
    const femalePercentage =
      totalGenderCount > 0
        ? Math.round((femaleCount / totalGenderCount) * 100)
        : 0;

    // Calculate children distribution percentages
    const totalFamiliesWithChildren =
      familiesWith2Children + familiesWithMoreThan2Children;
    const familiesWith2ChildrenPercentage =
      totalFamiliesWithChildren > 0
        ? Math.round((familiesWith2Children / totalFamiliesWithChildren) * 100)
        : 0;
    const familiesWithMoreThan2ChildrenPercentage =
      totalFamiliesWithChildren > 0
        ? Math.round(
            (familiesWithMoreThan2Children / totalFamiliesWithChildren) * 100
          )
        : 0;

    res.json({
      totalPopulation, // Absolute number
      familyCount, // Absolute number
      childrenCount, // Absolute number of children <= 18
      genderDistribution: {
        male: `${malePercentage}%`,
        female: `${femalePercentage}%`,
      },
      childrenDistribution: {
        familiesWith2Children: `${familiesWith2ChildrenPercentage}%`,
        familiesWithMoreThan2Children: `${familiesWithMoreThan2ChildrenPercentage}%`,
      },
    });
  } catch (error) {
    console.error("Error generating population statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default getUserStats;
