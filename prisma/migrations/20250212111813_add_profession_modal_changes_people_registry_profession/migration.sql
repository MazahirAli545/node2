/*
  Warnings:

  - You are about to drop the column `PR_PROFESSION_DESC` on the `PEOPLE_REGISTRY` table. All the data in the column will be lost.
  - You are about to drop the column `PROF_NAME` on the `PROFESSION` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` DROP COLUMN `PR_PROFESSION_DESC`,
    ADD COLUMN `PR_PROFESSION_DETA` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `PROFESSION` DROP COLUMN `PROF_NAME`;
