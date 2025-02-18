/*
  Warnings:

  - You are about to drop the `Child` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pincode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Child` DROP FOREIGN KEY `Child_userId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_pinCodeId_fkey`;

-- DropTable
DROP TABLE `Child`;

-- DropTable
DROP TABLE `Pincode`;

-- DropTable
DROP TABLE `User`;

-- CreateTable
CREATE TABLE `PEOPLE_REGISTRY` (
    `PR_ID` INTEGER NOT NULL AUTO_INCREMENT,
    `PR_UNIQUE_ID` VARCHAR(20) NOT NULL,
    `PR_FULL_NAME` VARCHAR(100) NOT NULL,
    `PR_DOB` DATETIME(3) NOT NULL,
    `PR_GENDER` CHAR(1) NULL,
    `PR_MOBILE_NO` VARCHAR(15) NULL,
    `PR_PROFESSION` VARCHAR(20) NULL,
    `PR_EDUCATION` VARCHAR(20) NULL,
    `PR_ADDRESS` TEXT NULL,
    `PR_PIN_CODE` CHAR(8) NULL,
    `PR_CITY` VARCHAR(50) NULL,
    `PR_STATE_CODE` CHAR(2) NOT NULL,
    `PR_DISTRICT_CODE` CHAR(2) NOT NULL,
    `PR_TOWN_CODE` CHAR(3) NOT NULL,
    `PR_FAMILY_NO` CHAR(3) NOT NULL,
    `PR_MEMBER_NO` CHAR(3) NOT NULL,
    `PR_FATHER_ID` INTEGER NULL,
    `PR_MOTHER_ID` INTEGER NULL,
    `PR_SPOUSE_ID` INTEGER NULL,
    `PR_PHOTO_URL` VARCHAR(255) NULL,
    `PR_CREATED_BY` INTEGER NULL,
    `PR_CREATED_AT` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `PR_UPDATED_BY` INTEGER NULL,
    `PR_UPDATED_AT` DATETIME(3) NULL,

    UNIQUE INDEX `PEOPLE_REGISTRY_PR_UNIQUE_ID_key`(`PR_UNIQUE_ID`),
    INDEX `PEOPLE_REGISTRY_PR_STATE_CODE_idx`(`PR_STATE_CODE`),
    INDEX `PEOPLE_REGISTRY_PR_DISTRICT_CODE_idx`(`PR_DISTRICT_CODE`),
    INDEX `PEOPLE_REGISTRY_PR_TOWN_CODE_idx`(`PR_TOWN_CODE`),
    UNIQUE INDEX `PEOPLE_REGISTRY_PR_FATHER_ID_key`(`PR_FATHER_ID`),
    UNIQUE INDEX `PEOPLE_REGISTRY_PR_MOTHER_ID_key`(`PR_MOTHER_ID`),
    UNIQUE INDEX `PEOPLE_REGISTRY_PR_SPOUSE_ID_key`(`PR_SPOUSE_ID`),
    PRIMARY KEY (`PR_ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
