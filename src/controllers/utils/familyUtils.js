import prisma from "../../db/prismaClient.js";

export async function getNextFamilyNumber(stateCode, districtCode, cityCode) {
  const prefix = `${stateCode}${districtCode}-${cityCode}`;

  const result = await prisma.$queryRaw`
    SELECT 
      MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(PR_UNIQUE_ID, '-', 4), '-', -1) AS UNSIGNED)) AS max_family
    FROM PEOPLE_REGISTRY
    WHERE PR_UNIQUE_ID LIKE CONCAT(${prefix}, '-%');
  `;

  const nextFamily = (result[0]?.max_family || 0) + 1;
  return String(nextFamily).padStart(4, "0");
}
