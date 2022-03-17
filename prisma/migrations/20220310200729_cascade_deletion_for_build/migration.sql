-- DropForeignKey
ALTER TABLE `line_coverage` DROP FOREIGN KEY `line_coverage_file_ref_fkey`;

-- DropForeignKey
ALTER TABLE `uncovered_files` DROP FOREIGN KEY `uncovered_files_build_ref_fkey`;

-- DropForeignKey
ALTER TABLE `uncovered_files` DROP FOREIGN KEY `uncovered_files_file_ref_fkey`;

-- DropForeignKey
ALTER TABLE `uncovered_lines` DROP FOREIGN KEY `uncovered_lines_build_ref_fkey`;

-- DropForeignKey
ALTER TABLE `uncovered_lines` DROP FOREIGN KEY `uncovered_lines_file_ref_fkey`;

-- AddForeignKey
ALTER TABLE `uncovered_files` ADD CONSTRAINT `uncovered_files_build_ref_fkey` FOREIGN KEY (`build_ref`) REFERENCES `builds`(`commit_sha`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `uncovered_files` ADD CONSTRAINT `uncovered_files_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `uncovered_lines` ADD CONSTRAINT `uncovered_lines_build_ref_fkey` FOREIGN KEY (`build_ref`) REFERENCES `builds`(`commit_sha`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `uncovered_lines` ADD CONSTRAINT `uncovered_lines_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `line_coverage` ADD CONSTRAINT `line_coverage_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE CASCADE ON UPDATE NO ACTION;
