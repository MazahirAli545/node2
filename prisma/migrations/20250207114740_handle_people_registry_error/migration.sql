-- AlterTable
ALTER TABLE `PEOPLE_REGISTRY` MODIFY `PR_STATE_CODE` CHAR(2) NULL,
    MODIFY `PR_DISTRICT_CODE` CHAR(2) NULL,
    MODIFY `PR_TOWN_CODE` CHAR(3) NULL,
    MODIFY `PR_FAMILY_NO` CHAR(3) NULL,
    MODIFY `PR_MEMBER_NO` CHAR(3) NULL;
