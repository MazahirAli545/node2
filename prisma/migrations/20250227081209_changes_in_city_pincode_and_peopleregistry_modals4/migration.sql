/*
  Warnings:

  - You are about to drop the column `areas` on the `CITY` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Pincode` DROP FOREIGN KEY `Pincode_cityId_fkey`;

-- DropIndex
DROP INDEX `Pincode_cityId_fkey` ON `Pincode`;

-- AlterTable
ALTER TABLE `CITY` DROP COLUMN `areas`;

-- AlterTable
ALTER TABLE `Pincode` MODIFY `cityId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Pincode` ADD CONSTRAINT `Pincode_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `CITY`(`CITY_ID`) ON DELETE SET NULL ON UPDATE CASCADE;
