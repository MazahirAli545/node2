// import prisma from "../db/prismaClient.js";

// export const getUserStats = async (req, res) => {
//   try {
//     console.log("🔍 Fetching user stats...");

//     const groupedMobile = await prisma.peopleRegistry.groupBy({
//       by: ["PR_MOBILE_NO"],
//       _count: { PR_MOBILE_NO: true },
//       having: {
//         PR_MOBILE_NO: {
//           _count: {
//             gt: 1,
//           },
//         },
//       },
//     });

//     const familyCount = groupedMobile.length;

//     const today = new Date();
//     const eighteenYearsAgo = new Date();
//     eighteenYearsAgo.setFullYear(today.getFullYear() - 18);

//     // Fetch necessary fields from PeopleRegistry
//     const allPeople = await prisma.peopleRegistry.findMany({
//       select: {
//         PR_ID: true,
//         PR_DOB: true,
//         PR_GENDER: true,
//         PR_FATHER_ID: true,
//         PR_MOTHER_ID: true,
//       },
//     });

//     let maleCount = 0;
//     let femaleCount = 0;
//     let childCount = 0;

//     // Step 1: Prepare parent-child map
//     const parentChildMap = new Map();

//     allPeople.forEach((person) => {
//       const dob = new Date(person.PR_DOB);
//       if (isNaN(dob)) return;

//       const age = today.getFullYear() - dob.getFullYear();
//       const hasBirthdayPassed =
//         today.getMonth() > dob.getMonth() ||
//         (today.getMonth() === dob.getMonth() &&
//           today.getDate() >= dob.getDate());

//       const actualAge = hasBirthdayPassed ? age : age - 1;

//       if (actualAge <= 18) {
//         childCount++;

//         // Add to father
//         if (person.PR_FATHER_ID) {
//           const fatherId = person.PR_FATHER_ID;
//           if (!parentChildMap.has(fatherId)) parentChildMap.set(fatherId, 0);
//           parentChildMap.set(fatherId, parentChildMap.get(fatherId) + 1);
//         }

//         // Add to mother
//         if (person.PR_MOTHER_ID) {
//           const motherId = person.PR_MOTHER_ID;
//           if (!parentChildMap.has(motherId)) parentChildMap.set(motherId, 0);
//           parentChildMap.set(motherId, parentChildMap.get(motherId) + 1);
//         }
//       } else {
//         if (person.PR_GENDER === "M") maleCount++;
//         else if (person.PR_GENDER === "F") femaleCount++;
//       }
//     });

//     const totalPopulation = maleCount + femaleCount + childCount;

//     // Step 2: Analyze parent-child map
//     let familiesWith2Children = 0;
//     let familiesWithMoreThan2Children = 0;

//     parentChildMap.forEach((count) => {
//       if (count === 2) familiesWith2Children++;
//       else if (count > 2) familiesWithMoreThan2Children++;
//     });

//     const malePercentage = totalPopulation
//       ? Math.round((maleCount / totalPopulation) * 100)
//       : 0;
//     const femalePercentage = totalPopulation
//       ? Math.round((femaleCount / totalPopulation) * 100)
//       : 0;
//     const childPercentage = totalPopulation
//       ? Math.round((childCount / totalPopulation) * 100)
//       : 0;

//     const totalFamiliesWithChildren =
//       familiesWith2Children + familiesWithMoreThan2Children;

//     const familiesWith2ChildrenPercentage = totalFamiliesWithChildren
//       ? Math.round((familiesWith2Children / totalFamiliesWithChildren) * 100)
//       : 0;

//     const familiesWithMoreThan2ChildrenPercentage = totalFamiliesWithChildren
//       ? Math.round(
//           (familiesWithMoreThan2Children / totalFamiliesWithChildren) * 100
//         )
//       : 0;

//     const stats = {
//       totalPopulation,
//       familyCount,
//       count: {
//         male: maleCount,
//         female: femaleCount,
//         child: childCount,
//       },
//       percentageDistribution: {
//         male: `${malePercentage}%`,
//         female: `${femalePercentage}%`,
//         child: `${childPercentage}%`,
//       },
//       childrenDistribution: {
//         familiesWith2Children: `${familiesWith2ChildrenPercentage}%`,
//         familiesWithMoreThan2Children: `${familiesWithMoreThan2ChildrenPercentage}%`,
//       },
//     };

//     console.log("📊 Final Stats:", stats);
//     res.json(stats);
//   } catch (error) {
//     console.error("❌ Error generating population statistics:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// export default getUserStats;

import prisma from "../db/prismaClient.js";

export const getUserStats = async (req, res) => {
  try {
    console.log("🔍 Fetching user stats...");

    // Group people by mobile number to detect families
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

    const today = new Date();
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18);

    // Fetch people data
    const allPeople = await prisma.peopleRegistry.findMany({
      select: {
        PR_ID: true,
        PR_DOB: true,
        PR_GENDER: true,
      },
    });

    let maleCount = 0;
    let femaleCount = 0;
    let childCount = 0;

    allPeople.forEach((person) => {
      const dob = new Date(person.PR_DOB);
      if (isNaN(dob)) return;

      const age = today.getFullYear() - dob.getFullYear();
      const hasBirthdayPassed =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() &&
          today.getDate() >= dob.getDate());

      const actualAge = hasBirthdayPassed ? age : age - 1;

      if (actualAge <= 18) {
        childCount++;
      } else {
        if (person.PR_GENDER === "M") maleCount++;
        else if (person.PR_GENDER === "F") femaleCount++;
      }
    });

    const totalPopulation = maleCount + femaleCount + childCount;

    const malePercentage = totalPopulation
      ? Math.round((maleCount / totalPopulation) * 100)
      : 0;
    const femalePercentage = totalPopulation
      ? Math.round((femaleCount / totalPopulation) * 100)
      : 0;
    const childPercentage = totalPopulation
      ? Math.round((childCount / totalPopulation) * 100)
      : 0;

    // Fetch all children from Child table
    const allChildren = await prisma.child.findMany({
      select: {
        userId: true, // this links to PR_ID
      },
    });

    // Count number of children per parent (userId)
    const parentChildMap = new Map();

    allChildren.forEach((child) => {
      const parentId = child.userId;
      if (!parentChildMap.has(parentId)) parentChildMap.set(parentId, 0);
      parentChildMap.set(parentId, parentChildMap.get(parentId) + 1);
    });

    // Analyze families with 2 or more children
    let familiesWith2Children = 0;
    let familiesWithMoreThan2Children = 0;

    parentChildMap.forEach((count) => {
      if (count === 2) familiesWith2Children++;
      else if (count > 2) familiesWithMoreThan2Children++;
    });

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
      count: {
        male: maleCount,
        female: femaleCount,
        child: childCount,
      },
      percentageDistribution: {
        male: `${malePercentage}%`,
        female: `${femalePercentage}%`,
        child: `${childPercentage}%`,
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
