/*
  Warnings:

  - Added the required column `PROF_NAME` to the `PROFESSION` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PROFESSION` ADD COLUMN `PROF_NAME` CHAR(50) NOT NULL;
