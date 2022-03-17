/*
  Warnings:

  - A unique constraint covering the columns `[line_number,line_text,file_ref,build_ref]` on the table `uncovered_lines` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `uncovered_lines_line_number_line_text_key` ON `uncovered_lines`;

-- CreateIndex
CREATE UNIQUE INDEX `uncovered_lines_line_number_line_text_file_ref_build_ref_key` ON `uncovered_lines`(`line_number`, `line_text`, `file_ref`, `build_ref`);
