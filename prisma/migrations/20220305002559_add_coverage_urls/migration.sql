-- AlterTable
ALTER TABLE `file_coverage` ADD COLUMN `coverage_url` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `line_coverage` ADD COLUMN `coverage_url` VARCHAR(255) NULL;
