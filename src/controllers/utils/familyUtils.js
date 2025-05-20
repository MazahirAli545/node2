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

  let familyNumber = "001";
  if (lastEntry && lastEntry.PR_UNIQUE_ID) {
    const parts = lastEntry.PR_UNIQUE_ID.split("-");
    if (parts.length === 4) {
      const lastFamily = parseInt(parts[2]);
      familyNumber = (lastFamily + 1).toString().padStart(3, "0");
    }
  }

  return familyNumber;
};
