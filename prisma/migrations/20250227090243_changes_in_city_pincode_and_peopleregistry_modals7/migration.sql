/*
  Warnings:

  - You are about to drop the column `cityId` on the `Pincode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Pincode` DROP FOREIGN KEY `Pincode_cityId_fkey`;

-- DropIndex
DROP INDEX `Pincode_cityId_fkey` ON `Pincode`;

-- AlterTable
ALTER TABLE `CITY` ADD COLUMN `pincode` VARCHAR(20) NULL,
    ADD COLUMN `pincodeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pincode` DROP COLUMN `cityId`;

-- AddForeignKey
ALTER TABLE `CITY` ADD CONSTRAINT `CITY_pincodeId_fkey` FOREIGN KEY (`pincodeId`) REFERENCES `Pincode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
