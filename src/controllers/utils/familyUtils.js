import prisma from "../../db/prismaClient.js";

export const getNextFamilyNumber = async (
  stateCode,
  districtCode,
  cityCode
) => {
  const lastEntry = await prisma.peopleRegistry.findFirst({
    where: {
      PR_STATE_CODE: stateCode,
      PR_DISTRICT_CODE: districtCode,
      PR_CITY_CODE: cityCode,
    },
    orderBy: { PR_UNIQUE_ID: "desc" },
  });

  // let familyNumber = "001";
  console.log("TATAT", lastEntry);

  let nextFamilyNumber = "0001"; // Default starting number

  if (lastEntry?.PR_FAMILY_NO) {
    const lastFamily = parseInt(lastEntry.PR_FAMILY_NO, 10);
    nextFamilyNumber = (lastFamily + 1).toString().padStart(4, "0");
  }

  return nextFamilyNumber;
};

// return res.status(200).json({
//   message: "Users fetched successfully",
//   success: true,
//   lastEntry,
// });
// };
