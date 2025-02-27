/*
  Warnings:

  - You are about to drop the `City` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cityId` to the `Pincode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `PEOPLE_REGISTRY` DROP FOREIGN KEY `PEOPLE_REGISTRY_PR_CITY_CODE_fkey`;

-- DropIndex
DROP INDEX `PEOPLE_REGISTRY_PR_CITY_CODE_fkey` ON `PEOPLE_REGISTRY`;

-- AlterTable
ALTER TABLE `Pincode` ADD COLUMN `cityId` INTEGER NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- DropTable
DROP TABLE `City`;

-- CreateTable
CREATE TABLE `CITY` (
    `CITY_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `CITY_NAME` VARCHAR(150) NULL,
    `areas` TEXT NOT NULL,
    `CITY_DS_CODE` VARCHAR(20) NULL DEFAULT 'default_ds_code',
    `CITY_DS_NAME` VARCHAR(100) NULL DEFAULT 'default_ds_name',
    `CITY_ST_CODE` VARCHAR(20) NULL DEFAULT 'default_st_code',
    `CITY_ST_NAME` VARCHAR(100) NULL DEFAULT 'default_st_name',
    `CITY_CREATED_BY` INTEGER NULL,
    `CITY_CREATED_AT` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `CITY_UPDATED_BY` INTEGER NULL,
    `CITY_UPDATED_AT` DATETIME(3) NULL,

    PRIMARY KEY (`CITY_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PEOPLE_REGISTRY` ADD CONSTRAINT `PEOPLE_REGISTRY_PR_CITY_CODE_fkey` FOREIGN KEY (`PR_CITY_CODE`) REFERENCES `CITY`(`CITY_ID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pincode` ADD CONSTRAINT `Pincode_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `CITY`(`CITY_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;
