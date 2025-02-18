/*
  Warnings:

  - You are about to alter the column `PR_PIN_CODE` on the `PEOPLE_REGISTRY` table. The data in that column could be lost. The data in that column will be cast from `Char(8)` to `Int`.
  - The primary key for the `Pincode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Pincode` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `PEOPLE_REGISTRY` DROP FOREIGN KEY `PEOPLE_REGISTRY_PR_PIN_CODE_fkey`;

-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` MODIFY `PR_PIN_CODE` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pincode` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `PEOPLE_REGISTRY` ADD CONSTRAINT `PEOPLE_REGISTRY_PR_PIN_CODE_fkey` FOREIGN KEY (`PR_PIN_CODE`) REFERENCES `Pincode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
