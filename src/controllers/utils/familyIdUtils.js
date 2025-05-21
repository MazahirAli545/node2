// // utils/familyIdUtils.js
// import prisma from "../../db/prismaClient.js";

// /**
//  * Generates PR_UNIQUE_ID based on business rules
//  * @param {string} PR_MOBILE_NO - User's mobile number
//  * @param {string} PR_STATE_CODE - State code (2 digits)
//  * @param {string} PR_DISTRICT_CODE - District code (2 digits)
//  * @param {number} PR_CITY_CODE - City ID
//  * @param {string} [PR_FULL_NAME] - Optional full name for duplicate checking
//  * @returns {Promise<{PR_UNIQUE_ID: string, PR_FAMILY_NO: string, PR_MEMBER_NO: string}>}
//  */
// export async function generateFamilyId(
//   PR_MOBILE_NO,
//   PR_STATE_CODE,
//   PR_DISTRICT_CODE,
//   PR_CITY_CODE,
//   PR_FULL_NAME = null
// ) {
//   // Default values for missing location info
//   const stateCode = PR_STATE_CODE || "00";
//   const districtCode = PR_DISTRICT_CODE || "00";
//   const cityCode = PR_CITY_CODE;

//   // 1. Check for existing users with same mobile number
//   const existingUsers = await prisma.peopleRegistry.findMany({
//     where: {
//       PR_MOBILE_NO,
//       PR_STATE_CODE: stateCode,
//       PR_DISTRICT_CODE: districtCode,
//       PR_CITY_CODE: cityCode,
//     },
//     orderBy: { PR_ID: "asc" },
//   });

//   let familyNumber = "0001";
//   let memberNumber = "0001";

//   if (existingUsers.length > 0) {
//     // Case 1: Same mobile number exists

//     // Optionally check for duplicate name if provided
//     if (PR_FULL_NAME) {
//       const duplicateUser = existingUsers.find(
//         (u) => u.PR_FULL_NAME.toLowerCase() === PR_FULL_NAME.toLowerCase()
//       );
//       if (duplicateUser) {
//         throw new Error("User with this mobile and name already exists");
//       }
//     }

//     // Get the family number from first member
//     familyNumber = existingUsers[0].PR_FAMILY_NO || "0001";

//     // Member number is next in sequence
//     memberNumber = (existingUsers.length + 1).toString().padStart(4, "0");
//   } else {
//     // Case 2: New mobile number - find next family number for location

//     // Find last family in the same location
//     const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
//       where: {
//         PR_STATE_CODE: stateCode,
//         PR_DISTRICT_CODE: districtCode,
//         PR_CITY_CODE: cityCode,
//       },
//       orderBy: { PR_FAMILY_NO: "desc" },
//     });

//     if (lastFamilyInLocation?.PR_FAMILY_NO) {
//       familyNumber = (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
//         .toString()
//         .padStart(4, "0");
//     }
//   }

//   // Format the unique ID
//   const PR_UNIQUE_ID = `${stateCode}${districtCode}-${cityCode}-${familyNumber}-${memberNumber}`;

//   return {
//     PR_UNIQUE_ID,
//     PR_FAMILY_NO: familyNumber,
//     PR_MEMBER_NO: memberNumber,
//   };
// }

// /**
//  * Handles ID regeneration when location changes
//  * @param {string} PR_MOBILE_NO
//  * @param {string} newStateCode
//  * @param {string} newDistrictCode
//  * @param {number} newCityCode
//  * @param {number} PR_ID - Current user ID (for member number calculation)
//  * @returns {Promise<{PR_UNIQUE_ID: string, PR_FAMILY_NO: string, PR_MEMBER_NO: string}>}
//  */
// export async function regenerateIdForNewLocation(
//   PR_MOBILE_NO,
//   newStateCode,
//   newDistrictCode,
//   newCityCode,
//   PR_ID
// ) {
//   // Get all family members (same mobile number)
//   const familyMembers = await prisma.peopleRegistry.findMany({
//     where: { PR_MOBILE_NO },
//     orderBy: { PR_ID: "asc" },
//   });

//   // Find last family in new location
//   const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
//     where: {
//       PR_STATE_CODE: newStateCode,
//       PR_DISTRICT_CODE: newDistrictCode,
//       PR_CITY_CODE: newCityCode,
//       NOT: { PR_MOBILE_NO }, // Exclude current family
//     },
//     orderBy: { PR_FAMILY_NO: "desc" },
//   });

//   // Determine new family number
//   let familyNumber = "0001";
//   if (lastFamilyInLocation?.PR_FAMILY_NO) {
//     familyNumber = (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
//       .toString()
//       .padStart(4, "0");
//   }

//   // Find member's position in family
//   const memberIndex = familyMembers.findIndex((m) => m.PR_ID === PR_ID);
//   const memberNumber = (
//     memberIndex >= 0 ? memberIndex + 1 : familyMembers.length + 1
//   )
//     .toString()
//     .padStart(4, "0");

//   return {
//     PR_UNIQUE_ID: `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${memberNumber}`,
//     PR_FAMILY_NO: familyNumber,
//     PR_MEMBER_NO: memberNumber,
//   };
// }

import prisma from "../../db/prismaClient.js";

/**
 * Generates PR_UNIQUE_ID based on business rules
 * @param {string} PR_MOBILE_NO - User's mobile number
 * @param {string} PR_STATE_CODE - State code (2 digits)
 * @param {string} PR_DISTRICT_CODE - District code (2 digits)
 * @param {number} PR_CITY_CODE - City ID
 * @param {string} [PR_FULL_NAME] - Optional full name for duplicate checking
 * @returns {Promise<{PR_UNIQUE_ID: string, PR_FAMILY_NO: string, PR_MEMBER_NO: string}>}
 */
export async function generateFamilyId(
  PR_MOBILE_NO,
  PR_STATE_CODE,
  PR_DISTRICT_CODE,
  PR_CITY_CODE,
  PR_FULL_NAME = null
) {
  const stateCode = PR_STATE_CODE || "00";
  const districtCode = PR_DISTRICT_CODE || "00";
  const cityCode = PR_CITY_CODE;

  // 1. Fetch existing users with same mobile and location
  const existingUsers = await prisma.peopleRegistry.findMany({
    where: {
      PR_MOBILE_NO,
      PR_STATE_CODE: stateCode,
      PR_DISTRICT_CODE: districtCode,
      PR_CITY_CODE: cityCode,
    },
    orderBy: { PR_ID: "asc" },
  });

  let familyNumber = "0001";
  let memberNumber = "0001";

  if (existingUsers.length > 0) {
    // Check if the same full name already exists
    const duplicateUser = PR_FULL_NAME
      ? existingUsers.find(
          (u) => u.PR_FULL_NAME?.toLowerCase() === PR_FULL_NAME.toLowerCase()
        )
      : null;

    if (duplicateUser) {
      // Reuse the family number and assign next member number
      familyNumber = duplicateUser.PR_FAMILY_NO || "0001";
      // memberNumber = (existingUsers.length + 1).toString().padStart(4, "0");
      const currentFamilyMembers = await prisma.peopleRegistry.count({
        where: {
          PR_FAMILY_NO: familyNumber,
          PR_STATE_CODE: stateCode,
          PR_DISTRICT_CODE: districtCode,
          PR_CITY_CODE: cityCode,
        },
      });

      memberNumber = (currentFamilyMembers + 1).toString().padStart(4, "0");
    } else {
      // Different name => treat as new family in same location
      const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
        where: {
          PR_STATE_CODE: stateCode,
          PR_DISTRICT_CODE: districtCode,
          PR_CITY_CODE: cityCode,
        },
        orderBy: { PR_FAMILY_NO: "desc" },
      });

      familyNumber = lastFamilyInLocation?.PR_FAMILY_NO
        ? (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
            .toString()
            .padStart(4, "0")
        : "0001";
      memberNumber = "0001";
    }
  } else {
    // New mobile number or no user in this location — assign new family
    const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
      where: {
        PR_STATE_CODE: stateCode,
        PR_DISTRICT_CODE: districtCode,
        PR_CITY_CODE: cityCode,
      },
      orderBy: { PR_FAMILY_NO: "desc" },
    });

    familyNumber = lastFamilyInLocation?.PR_FAMILY_NO
      ? (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
          .toString()
          .padStart(4, "0")
      : "0001";
    memberNumber = "0001";
  }

  const PR_UNIQUE_ID = `${stateCode}${districtCode}-${cityCode}-${familyNumber}-${memberNumber}`;

  return {
    PR_UNIQUE_ID,
    PR_FAMILY_NO: familyNumber,
    PR_MEMBER_NO: memberNumber,
  };
}

/**
 * Handles ID regeneration when location changes
 */
export async function regenerateIdForNewLocation(
  PR_MOBILE_NO,
  newStateCode,
  newDistrictCode,
  newCityCode,
  PR_ID
) {
  const familyMembers = await prisma.peopleRegistry.findMany({
    where: { PR_MOBILE_NO },
    orderBy: { PR_ID: "asc" },
  });

  const lastFamilyInLocation = await prisma.peopleRegistry.findFirst({
    where: {
      PR_STATE_CODE: newStateCode,
      PR_DISTRICT_CODE: newDistrictCode,
      PR_CITY_CODE: newCityCode,
      NOT: { PR_MOBILE_NO },
    },
    orderBy: { PR_FAMILY_NO: "desc" },
  });

  let familyNumber = "0001";
  if (lastFamilyInLocation?.PR_FAMILY_NO) {
    familyNumber = (parseInt(lastFamilyInLocation.PR_FAMILY_NO) + 1)
      .toString()
      .padStart(4, "0");
  }

  const memberIndex = familyMembers.findIndex((m) => m.PR_ID === PR_ID);
  const memberNumber = (
    memberIndex >= 0 ? memberIndex + 1 : familyMembers.length + 1
  )
    .toString()
    .padStart(4, "0");

  return {
    PR_UNIQUE_ID: `${newStateCode}${newDistrictCode}-${newCityCode}-${familyNumber}-${memberNumber}`,
    PR_FAMILY_NO: familyNumber,
    PR_MEMBER_NO: memberNumber,
  };
}
