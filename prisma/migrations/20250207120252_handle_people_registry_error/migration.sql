/*
  Warnings:

  - A unique constraint covering the columns `[PR_MOBILE_NO]` on the table `PEOPLE_REGISTRY` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `PEOPLE_REGISTRY_PR_MOBILE_NO_key` ON `PEOPLE_REGISTRY`(`PR_MOBILE_NO`);
