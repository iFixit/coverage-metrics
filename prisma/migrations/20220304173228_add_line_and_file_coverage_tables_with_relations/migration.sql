-- CreateTable
CREATE TABLE `builds` (
    `created_at` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NULL,
    `commit_message` VARCHAR(255) NOT NULL,
    `branch` VARCHAR(255) NOT NULL,
    `committer_name` VARCHAR(255) NOT NULL,
    `committer_email` VARCHAR(255) NOT NULL,
    `commit_sha` VARCHAR(255) NOT NULL,
    `repo_name` VARCHAR(255) NOT NULL,
    `badge_url` VARCHAR(255) NOT NULL,
    `coverage_change` DOUBLE NOT NULL,
    `covered_percent` DOUBLE NOT NULL,

    PRIMARY KEY (`commit_sha`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unconvered_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lines_uncovered` INTEGER NOT NULL,
    `coverage` DOUBLE NOT NULL,
    `delta` DOUBLE NOT NULL,
    `file_ref` VARCHAR(255) NOT NULL,
    `build_ref` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `unconvered_lines_build_ref_file_ref_key`(`build_ref`, `file_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `line_coverage` (
    `line_number` INTEGER NOT NULL,
    `line_text` VARCHAR(255) NOT NULL,
    `times_uncovered` INTEGER NOT NULL,
    `file_ref` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`line_number`, `line_text`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_coverage` (
    `file` VARCHAR(255) NOT NULL,
    `times_coverage_changed` INTEGER NOT NULL,
    `current_coverage` DOUBLE NOT NULL,

    PRIMARY KEY (`file`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `unconvered_lines` ADD CONSTRAINT `unconvered_lines_build_ref_fkey` FOREIGN KEY (`build_ref`) REFERENCES `builds`(`commit_sha`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unconvered_lines` ADD CONSTRAINT `unconvered_lines_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `line_coverage` ADD CONSTRAINT `line_coverage_file_ref_fkey` FOREIGN KEY (`file_ref`) REFERENCES `file_coverage`(`file`) ON DELETE RESTRICT ON UPDATE CASCADE;
