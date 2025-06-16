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

//     const allPeople = await prisma.peopleRegistry.findMany({
//       select: {
//         PR_ID: true,
//         PR_DOB: true,
//         PR_GENDER: true,
//         PR_FATHER_ID: true,
//         PR_MOTHER_ID: true,
//         PR_BUSS_INTER: true, // Added this field for business interest calculation
//       },
//     });

//     let maleCount = 0;
//     let femaleCount = 0;
//     let childCount = 0;
//     let businessInterestCount = 0;

//     const parentMapFromPeopleRegistry = new Map();

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

//         if (person.PR_FATHER_ID) {
//           const id = person.PR_FATHER_ID;
//           parentMapFromPeopleRegistry.set(
//             id,
//             (parentMapFromPeopleRegistry.get(id) || 0) + 1
//           );
//         }

//         if (person.PR_MOTHER_ID) {
//           const id = person.PR_MOTHER_ID;
//           parentMapFromPeopleRegistry.set(
//             id,
//             (parentMapFromPeopleRegistry.get(id) || 0) + 1
//           );
//         }
//       } else {
//         if (person.PR_GENDER === "M") maleCount++;
//         else if (person.PR_GENDER === "F") femaleCount++;
//       }

//       if (person.PR_BUSS_INTER === "Y") {
//         businessInterestCount++;
//       }
//     });

//     const totalPopulation = maleCount + femaleCount + childCount;

//     const expectedPopulation = totalPopulation;

//     const malePercentage = expectedPopulation
//       ? Math.round((maleCount / expectedPopulation) * 100)
//       : 0;
//     const femalePercentage = expectedPopulation
//       ? Math.round((femaleCount / expectedPopulation) * 100)
//       : 0;
//     const childPercentage = expectedPopulation
//       ? Math.round((childCount / expectedPopulation) * 100)
//       : 0;
//     const businessInterestPercentage = expectedPopulation
//       ? Math.round((businessInterestCount / expectedPopulation) * 100)
//       : 0;

//     const childrenFromChildTable = await prisma.child.findMany({
//       select: {
//         userId: true,
//       },
//     });

//     const parentMapFromChildTable = new Map();

//     childrenFromChildTable.forEach((child) => {
//       const parentId = child.userId;
//       parentMapFromChildTable.set(
//         parentId,
//         (parentMapFromChildTable.get(parentId) || 0) + 1
//       );
//     });

//     const calcDistribution = (map) => {
//       let with2 = 0;
//       let withMoreThan2 = 0;
//       map.forEach((count) => {
//         if (count === 2) with2++;
//         else if (count > 2) withMoreThan2++;
//       });

//       const totalFamilies = with2 + withMoreThan2;
//       const with2Pct = totalFamilies
//         ? Math.round((with2 / totalFamilies) * 100)
//         : 0;
//       const withMoreThan2Pct = totalFamilies
//         ? Math.round((withMoreThan2 / totalFamilies) * 100)
//         : 0;

//       return {
//         familiesWith2Children: `${with2Pct}%`,
//         familiesWithMoreThan2Children: `${withMoreThan2Pct}%`,
//       };
//     };

//     const childrenDistribution = {
//       fromChildTable: calcDistribution(parentMapFromChildTable),
//       fromPeopleRegistry: calcDistribution(parentMapFromPeopleRegistry),
//     };

//     const donations = await prisma.donationPayment.findMany({
//       select: {
//         id: true,
//         amount: true,
//       },
//     });

//     const totalDonations = donations.length;
//     const totalDonationAmount = donations.reduce(
//       (sum, donation) => sum + donation.amount,
//       0
//     );

//     const donationPercentageOfPopulation = expectedPopulation
//       ? Math.round((totalDonations / expectedPopulation) * 100)
//       : 0;

//     const stats = {
//       totalPopulation: expectedPopulation,
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
//       childrenDistribution,
//       donationStats: {
//         totalDonations,
//         totalDonationAmount,
//         donationPercentageOfPopulation: `${donationPercentageOfPopulation}%`,
//       },
//       businessInterestStats: {
//         interestedCount: businessInterestCount,
//         percentageOfPopulation: `${businessInterestPercentage}%`,
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

    const allPeople = await prisma.peopleRegistry.findMany({
      select: {
        PR_ID: true,
        PR_DOB: true,
        PR_GENDER: true,
        PR_FATHER_ID: true,
        PR_MOTHER_ID: true,
        PR_BUSS_INTER: true,
      },
    });

    let maleCount = 0;
    let femaleCount = 0;
    let childCount = 0;
    const peopleWithBusinessInterest = new Set();
    const peopleWhoDonated = new Set();

    const parentMapFromPeopleRegistry = new Map();

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

        if (person.PR_FATHER_ID) {
          const id = person.PR_FATHER_ID;
          parentMapFromPeopleRegistry.set(
            id,
            (parentMapFromPeopleRegistry.get(id) || 0) + 1
          );
        }

        if (person.PR_MOTHER_ID) {
          const id = person.PR_MOTHER_ID;
          parentMapFromPeopleRegistry.set(
            id,
            (parentMapFromPeopleRegistry.get(id) || 0) + 1
          );
        }
      } else {
        if (person.PR_GENDER === "M") maleCount++;
        else if (person.PR_GENDER === "F") femaleCount++;
      }

      if (person.PR_BUSS_INTER === "Y") {
        peopleWithBusinessInterest.add(person.PR_ID);
      }
    });

    const totalPopulation = maleCount + femaleCount + childCount;

    const expectedPopulation = totalPopulation;

    const malePercentage = expectedPopulation
      ? Math.round((maleCount / expectedPopulation) * 100)
      : 0;
    const femalePercentage = expectedPopulation
      ? Math.round((femaleCount / expectedPopulation) * 100)
      : 0;
    const childPercentage = expectedPopulation
      ? Math.round((childCount / expectedPopulation) * 100)
      : 0;
    const businessInterestPercentage = expectedPopulation
      ? Math.round((peopleWithBusinessInterest.size / expectedPopulation) * 100)
      : 0;

    const childrenFromChildTable = await prisma.child.findMany({
      select: {
        userId: true,
      },
    });

    const parentMapFromChildTable = new Map();

    childrenFromChildTable.forEach((child) => {
      const parentId = child.userId;
      parentMapFromChildTable.set(
        parentId,
        (parentMapFromChildTable.get(parentId) || 0) + 1
      );
    });

    const calcDistribution = (map) => {
      let with2 = 0;
      let withMoreThan2 = 0;
      map.forEach((count) => {
        if (count === 2) with2++;
        else if (count > 2) withMoreThan2++;
      });

      const totalFamilies = with2 + withMoreThan2;
      const with2Pct = totalFamilies
        ? Math.round((with2 / totalFamilies) * 100)
        : 0;
      const withMoreThan2Pct = totalFamilies
        ? Math.round((withMoreThan2 / totalFamilies) * 100)
        : 0;

      return {
        familiesWith2Children: `${with2Pct}%`,
        familiesWithMoreThan2Children: `${withMoreThan2Pct}%`,
      };
    };

    const childrenDistribution = {
      fromChildTable: calcDistribution(parentMapFromChildTable),
      fromPeopleRegistry: calcDistribution(parentMapFromPeopleRegistry),
    };

    const donations = await prisma.donationPayment.findMany({
      select: {
        id: true,
        amount: true,
        PR_ID: true, // Changed from userId to PR_ID
      },
    });

    // Count unique donors
    donations.forEach((donation) => {
      if (donation.PR_ID) {
        peopleWhoDonated.add(donation.PR_ID);
      }
    });

    const totalDonations = donations.length;
    const totalDonationAmount = donations.reduce(
      (sum, donation) => sum + donation.amount,
      0
    );

    const donationPercentageOfPopulation = expectedPopulation
      ? Math.round((peopleWhoDonated.size / expectedPopulation) * 100)
      : 0;

    const stats = {
      totalPopulation: expectedPopulation,
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
      childrenDistribution,
      donationStats: {
        totalDonations,
        totalDonationAmount,
        uniqueDonors: peopleWhoDonated.size,
        donationPercentageOfPopulation: `${donationPercentageOfPopulation}%`,
      },
      businessInterestStats: {
        interestedCount: peopleWithBusinessInterest.size,
        percentageOfPopulation: `${businessInterestPercentage}%`,
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
