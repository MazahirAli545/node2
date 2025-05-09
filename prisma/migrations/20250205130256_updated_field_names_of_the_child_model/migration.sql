/*
  Warnings:

  - You are about to drop the column `childDob` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `childName` on the `Child` table. All the data in the column will be lost.
  - Added the required column `dob` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Child` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Child` DROP COLUMN `childDob`,
    DROP COLUMN `childName`,
    ADD COLUMN `dob` DATETIME(3) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;
