-- CreateTable
CREATE TABLE `uncovered_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `line_number` INTEGER NOT NULL,
    `line_text` VARCHAR(255) NOT NULL,
    `file_ref` VARCHAR(255) NOT NULL,
    `build_ref` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `uncovered_lines_line_number_line_text_key`(`line_number`, `line_text`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `uncovered_lines` ADD CONSTRAINT `uncovered_lines_build_ref_fkey` FOREIGN KEY (`build_ref`) REFERENCES `builds`(`commit_sha`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uncovered_lines` ADD CONSTRAINT `uncovered_lines_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE RESTRICT ON UPDATE CASCADE;
