/*
  Warnings:

  - You are about to drop the column `PR_PIN_CODE` on the `PEOPLE_REGISTRY` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `PEOPLE_REGISTRY` DROP FOREIGN KEY `PEOPLE_REGISTRY_PR_PIN_CODE_fkey`;

-- DropIndex
DROP INDEX `PEOPLE_REGISTRY_PR_PIN_CODE_fkey` ON `PEOPLE_REGISTRY`;

-- DropIndex
DROP INDEX `Pincode_value_key` ON `Pincode`;

-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` DROP COLUMN `PR_PIN_CODE`;

-- AlterTable
ALTER TABLE `Pincode` MODIFY `value` VARCHAR(8) NOT NULL;
