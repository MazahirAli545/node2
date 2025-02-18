/*
  Warnings:

  - You are about to alter the column `PR_FAMILY_NO` on the `PEOPLE_REGISTRY` table. The data in that column could be lost. The data in that column will be cast from `Char(10)` to `Char(3)`.
  - You are about to alter the column `PR_MEMBER_NO` on the `PEOPLE_REGISTRY` table. The data in that column could be lost. The data in that column will be cast from `Char(10)` to `Char(3)`.
  - You are about to alter the column `PR_CITY_CODE` on the `PEOPLE_REGISTRY` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Int`.

*/
-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` MODIFY `PR_STATE_CODE` CHAR(20) NULL,
    MODIFY `PR_DISTRICT_CODE` CHAR(20) NULL,
    MODIFY `PR_FAMILY_NO` CHAR(3) NULL,
    MODIFY `PR_MEMBER_NO` CHAR(3) NULL,
    MODIFY `PR_CITY_CODE` INTEGER NULL;

-- CreateTable
CREATE TABLE `City` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `city_name` VARCHAR(20) NOT NULL,
    `ds_code` VARCHAR(20) NOT NULL DEFAULT 'default_ds_code',
    `ds_name` VARCHAR(20) NOT NULL DEFAULT 'default_ds_name',
    `st_code` VARCHAR(20) NOT NULL DEFAULT 'default_st_code',
    `st_name` VARCHAR(20) NOT NULL DEFAULT 'default_st_name',
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_by` INTEGER NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `City_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PEOPLE_REGISTRY` ADD CONSTRAINT `PEOPLE_REGISTRY_PR_CITY_CODE_fkey` FOREIGN KEY (`PR_CITY_CODE`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
