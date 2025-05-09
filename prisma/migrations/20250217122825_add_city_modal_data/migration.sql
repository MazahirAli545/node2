/*
  Warnings:

  - The primary key for the `City` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `city_name` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `ds_code` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `ds_name` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `st_code` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `st_name` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `City` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `City` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[CITY_CODE]` on the table `City` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[CITY_ID]` on the table `City` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `CITY_CODE` to the `City` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CITY_ID` to the `City` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CITY_NAME` to the `City` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CITY_PIN_CODE` to the `City` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `PEOPLE_REGISTRY` DROP FOREIGN KEY `PEOPLE_REGISTRY_PR_CITY_CODE_fkey`;

-- DropIndex
DROP INDEX `City_id_key` ON `City`;

-- DropIndex
DROP INDEX `PEOPLE_REGISTRY_PR_CITY_CODE_fkey` ON `PEOPLE_REGISTRY`;

-- AlterTable
ALTER TABLE `City` DROP PRIMARY KEY,
    DROP COLUMN `city_name`,
    DROP COLUMN `created_at`,
    DROP COLUMN `created_by`,
    DROP COLUMN `ds_code`,
    DROP COLUMN `ds_name`,
    DROP COLUMN `id`,
    DROP COLUMN `st_code`,
    DROP COLUMN `st_name`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `updated_by`,
    ADD COLUMN `CITY_CODE` INTEGER NOT NULL,
    ADD COLUMN `CITY_CREATED_AT` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `CITY_CREATED_BY` INTEGER NULL,
    ADD COLUMN `CITY_DS_CODE` VARCHAR(20) NOT NULL DEFAULT 'default_ds_code',
    ADD COLUMN `CITY_DS_NAME` VARCHAR(20) NOT NULL DEFAULT 'default_ds_name',
    ADD COLUMN `CITY_ID` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `CITY_NAME` VARCHAR(20) NOT NULL,
    ADD COLUMN `CITY_PIN_CODE` CHAR(8) NOT NULL,
    ADD COLUMN `CITY_ST_CODE` VARCHAR(20) NOT NULL DEFAULT 'default_st_code',
    ADD COLUMN `CITY_ST_NAME` VARCHAR(20) NOT NULL DEFAULT 'default_st_name',
    ADD COLUMN `CITY_UPDATED_AT` DATETIME(3) NULL,
    ADD COLUMN `CITY_UPDATED_BY` INTEGER NULL,
    ADD PRIMARY KEY (`CITY_ID`);

-- CreateIndex
CREATE UNIQUE INDEX `City_CITY_CODE_key` ON `City`(`CITY_CODE`);

-- CreateIndex
CREATE UNIQUE INDEX `City_CITY_ID_key` ON `City`(`CITY_ID`);

-- AddForeignKey
ALTER TABLE `PEOPLE_REGISTRY` ADD CONSTRAINT `PEOPLE_REGISTRY_PR_CITY_CODE_fkey` FOREIGN KEY (`PR_CITY_CODE`) REFERENCES `City`(`CITY_ID`) ON DELETE SET NULL ON UPDATE CASCADE;
