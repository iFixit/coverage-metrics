/*
  Warnings:

  - You are about to drop the `unconvered_lines` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `unconvered_lines` DROP FOREIGN KEY `unconvered_lines_build_ref_fkey`;

-- DropForeignKey
ALTER TABLE `unconvered_lines` DROP FOREIGN KEY `unconvered_lines_file_ref_fkey`;

-- DropTable
DROP TABLE `unconvered_lines`;

-- CreateTable
CREATE TABLE `uncovered_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lines_uncovered` INTEGER NOT NULL,
    `coverage` DOUBLE NOT NULL,
    `delta` DOUBLE NOT NULL,
    `file_ref` VARCHAR(255) NOT NULL,
    `build_ref` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `uncovered_files_build_ref_file_ref_key`(`build_ref`, `file_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `uncovered_files` ADD CONSTRAINT `uncovered_files_build_ref_fkey` FOREIGN KEY (`build_ref`) REFERENCES `builds`(`commit_sha`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uncovered_files` ADD CONSTRAINT `uncovered_files_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE RESTRICT ON UPDATE CASCADE;
