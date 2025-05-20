// import prisma from "../../db/prismaClient.js";

// export const getNextFamilyNumber = async (
//   stateCode,
//   districtCode,
//   cityCode
// ) => {
//   const lastEntry = await prisma.peopleRegistry.findFirst({
//     where: {
//       PR_STATE_CODE: stateCode,
//       PR_DISTRICT_CODE: districtCode,
//       PR_CITY_CODE: cityCode,
//     },
//     orderBy: { PR_UNIQUE_ID: "desc" },
//   });

//   let familyNumber = "001";
//   if (lastEntry && lastEntry.PR_UNIQUE_ID) {
//     const parts = lastEntry.PR_UNIQUE_ID.split("-");
//     if (parts.length === 4) {
//       const lastFamily = parseInt(parts[2]);
//       familyNumber = (lastFamily + 1).toString().padStart(3, "0");
//     }
//   }

//   return familyNumber;
// };

// In ../controllers/utils/familyUtils.js

export const getNextFamilyNumber = async (stateCode, districtCode, cityId) => {
  try {
    // Find the last user in this city
    const lastUserInArea = await prisma.peopleRegistry.findFirst({
      where: {
        PR_STATE_CODE: stateCode,
        PR_DISTRICT_CODE: districtCode,
        PR_CITY_CODE: cityId,
      },
      orderBy: { PR_FAMILY_NO: "desc" },
    });

    if (lastUserInArea) {
      // Parse family number as integer and increment
      const lastFamilyNum = parseInt(lastUserInArea.PR_FAMILY_NO, 10);
      return (lastFamilyNum + 1).toString().padStart(3, "0");
    }

    // If no existing users in this area, start with "001"
    return "001";
  } catch (error) {
    console.error("Error getting next family number:", error);
    return "001"; // Default in case of error
  }
};
