/*
  Warnings:

  - A unique constraint covering the columns `[PR_PIN_CODE]` on the table `PEOPLE_REGISTRY` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE `Pincode` (
    `id` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Child` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `dob` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `PEOPLE_REGISTRY_PR_PIN_CODE_key` ON `PEOPLE_REGISTRY`(`PR_PIN_CODE`);

-- AddForeignKey
ALTER TABLE `PEOPLE_REGISTRY` ADD CONSTRAINT `PEOPLE_REGISTRY_PR_PIN_CODE_fkey` FOREIGN KEY (`PR_PIN_CODE`) REFERENCES `Pincode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Child` ADD CONSTRAINT `Child_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PEOPLE_REGISTRY`(`PR_ID`) ON DELETE RESTRICT ON UPDATE CASCADE;
