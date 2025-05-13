import { PrismaClient } from "@prisma/client";
import prisma from "../db/prismaClient.js";

export const getUserStats = async (req, res) => {
  try {
    console.log("🔍 Fetching user stats...");

    const totalPopulation = await prisma.peopleRegistry.count();
    console.log("✅ Total population:", totalPopulation);

    const genderCounts = await prisma.peopleRegistry.groupBy({
      by: ["PR_GENDER"],
      _count: { PR_GENDER: true },
      where: {
        PR_GENDER: { in: ["M", "F"] },
      },
    });

    const groupedMobile = await prisma.peopleRegistry.groupBy({
      by: ["PR_MOBILE_NO"],
      _count: { PR_MOBILE_NO: true },
      having: {
        PR_MOBILE_NO: {
          _count: {
            gt: 1,
          },
        },
      },
    });
    const familyCount = groupedMobile.length;

    const familiesWith2ChildrenResult = await prisma.$queryRaw`
      SELECT COUNT(*) AS count FROM (
        SELECT PR_MOBILE_NO
        FROM \`PeopleRegistry\`
        GROUP BY PR_MOBILE_NO
        HAVING COUNT(*) = 2
      ) AS families;
    `;
    const familiesWith2Children = Number(
      familiesWith2ChildrenResult[0]?.count || 0
    );

    const familiesWithMoreThan2ChildrenResult = await prisma.$queryRaw`
      SELECT COUNT(*) AS count FROM (
        SELECT PR_MOBILE_NO
        FROM \`PeopleRegistry\`
        GROUP BY PR_MOBILE_NO
        HAVING COUNT(*) > 2
      ) AS families;
    `;
    const familiesWithMoreThan2Children = Number(
      familiesWithMoreThan2ChildrenResult[0]?.count || 0
    );

    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    const childrenCount = await prisma.child.count({
      where: {
        dob: {
          gte: eighteenYearsAgo,
        },
      },
    });

    // Gender Distribution Calculation
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

    console.log("📊 Final Stats:", stats);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error generating population statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default getUserStats;
