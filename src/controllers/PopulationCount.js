import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";

export const getUserStats = async (req, res) => {
  try {
    console.log("Fetching user stats...");

    const [
      totalPopulation,
      genderCounts,
      familyCount,
      familiesWith2Children,
      familiesWithMoreThan2Children,
      childrenCount,
    ] = await Promise.all([
      // 1. Total population count
      prisma.peopleRegistry.count(),

      // 2. Gender counts (M/F)
      prisma.peopleRegistry.groupBy({
        by: ["PR_GENDER"],
        _count: { PR_GENDER: true },
        where: {
          PR_GENDER: { in: ["M", "F"] },
        },
      }),

      // 3. Family count: Mobile numbers with >1 members
      prisma.peopleRegistry
        .groupBy({
          by: ["PR_MOBILE_NO"],
          _count: { PR_MOBILE_NO: true },
          having: {
            PR_MOBILE_NO: {
              _count: {
                gt: 1,
              },
            },
          },
        })
        .then((results) => results.length),

      // 4. Families with exactly 2 children
      prisma.$queryRaw`
        SELECT COUNT(*) AS count FROM (
          SELECT PR_MOBILE_NO
          FROM "PeopleRegistry"
          GROUP BY PR_MOBILE_NO
          HAVING COUNT(*) = 2
        ) AS families;
      `.then((result) => Number(result[0]?.count || 0)),

      // 5. Families with more than 2 children
      prisma.$queryRaw`
        SELECT COUNT(*) AS count FROM (
          SELECT PR_MOBILE_NO
          FROM "PeopleRegistry"
          GROUP BY PR_MOBILE_NO
          HAVING COUNT(*) > 2
        ) AS families;
      `.then((result) => Number(result[0]?.count || 0)),

      // 6. Children aged <= 18
      (async () => {
        try {
          const eighteenYearsAgo = new Date();
          eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

          const count = await prisma.child.count({
            where: {
              dob: {
                gte: eighteenYearsAgo, // children who are 18 or younger
              },
            },
          });
          console.log(`Children <= 18: ${count}`);
          return count;
        } catch (err) {
          console.error("Error counting children <=18:", err);
          return 0;
        }
      })(),
    ]);

    // Calculate gender percentages
    const maleCount =
      genderCounts.find((g) => g.PR_GENDER === "M")?._count?.PR_GENDER || 0;
    const femaleCount =
      genderCounts.find((g) => g.PR_GENDER === "F")?._count?.PR_GENDER || 0;

    const totalGenderCount = maleCount + femaleCount;
    const malePercentage = totalGenderCount
      ? Math.round((maleCount / totalGenderCount) * 100)
      : 0;
    const femalePercentage = totalGenderCount
      ? Math.round((femaleCount / totalGenderCount) * 100)
      : 0;

    // Children distribution
    const totalFamiliesWithChildren =
      familiesWith2Children + familiesWithMoreThan2Children;

    const familiesWith2ChildrenPercentage = totalFamiliesWithChildren
      ? Math.round((familiesWith2Children / totalFamiliesWithChildren) * 100)
      : 0;
    const familiesWithMoreThan2ChildrenPercentage = totalFamiliesWithChildren
      ? Math.round(
          (familiesWithMoreThan2Children / totalFamiliesWithChildren) * 100
        )
      : 0;

    const stats = {
      totalPopulation,
      familyCount,
      childrenCount,
      genderDistribution: {
        male: `${malePercentage}%`,
        female: `${femalePercentage}%`,
      },
      childrenDistribution: {
        familiesWith2Children: `${familiesWith2ChildrenPercentage}%`,
        familiesWithMoreThan2Children: `${familiesWithMoreThan2ChildrenPercentage}%`,
      },
    };

    console.log("Stats generated:", stats);
    res.json(stats);
  } catch (error) {
    console.error("Error generating population statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default getUserStats;
