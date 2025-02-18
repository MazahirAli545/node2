/*
  Warnings:

  - A unique constraint covering the columns `[value]` on the table `Pincode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `PEOPLE_REGISTRY` DROP FOREIGN KEY `PEOPLE_REGISTRY_PR_PIN_CODE_fkey`;

-- DropIndex
DROP INDEX `PEOPLE_REGISTRY_PR_PIN_CODE_key` ON `PEOPLE_REGISTRY`;

-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` MODIFY `PR_PIN_CODE` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Pincode_value_key` ON `Pincode`(`value`);

-- AddForeignKey
ALTER TABLE `PEOPLE_REGISTRY` ADD CONSTRAINT `PEOPLE_REGISTRY_PR_PIN_CODE_fkey` FOREIGN KEY (`PR_PIN_CODE`) REFERENCES `Pincode`(`value`) ON DELETE SET NULL ON UPDATE CASCADE;
