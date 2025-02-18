/*
  Warnings:

  - Made the column `userId` on table `Child` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Child` DROP FOREIGN KEY `Child_userId_fkey`;

-- DropIndex
DROP INDEX `Child_userId_fkey` ON `Child`;

-- AlterTable
ALTER TABLE `Child` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Child` ADD CONSTRAINT `Child_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
