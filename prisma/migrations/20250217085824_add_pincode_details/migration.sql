-- AlterTable
ALTER TABLE `Pincode` ADD COLUMN `DS_Code` VARCHAR(20) NOT NULL DEFAULT 'default_ds_code',
    ADD COLUMN `DS_NAME` VARCHAR(20) NOT NULL DEFAULT 'default_ds_name',
    ADD COLUMN `ST_CODE` VARCHAR(20) NOT NULL DEFAULT 'default_st_code',
    ADD COLUMN `ST_NAME` VARCHAR(20) NOT NULL DEFAULT 'default_st_name',
    MODIFY `value` CHAR(8) NOT NULL;
