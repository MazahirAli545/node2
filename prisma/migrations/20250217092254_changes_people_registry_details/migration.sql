/*
  Warnings:

  - You are about to drop the column `PR_CITY` on the `PEOPLE_REGISTRY` table. All the data in the column will be lost.
  - You are about to drop the column `PR_TOWN_CODE` on the `PEOPLE_REGISTRY` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `PEOPLE_REGISTRY_PR_TOWN_CODE_idx` ON `PEOPLE_REGISTRY`;

-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` DROP COLUMN `PR_CITY`,
    DROP COLUMN `PR_TOWN_CODE`,
    ADD COLUMN `PR_CITY_CODE` VARCHAR(50) NULL;
