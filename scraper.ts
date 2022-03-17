import { UncoveredFile, UncoveredLine } from "@prisma/client";
import cheerio from "cheerio";


export function scrapeUncoveredFiles(build_page: string,build_commit_sha:string) {
  const $ = cheerio.load(build_page)
  const coverage_files:any[] = []
  $('.missed-lines > h4:contains("Uncovered Existing Lines")').parent().find('tr').get().map((row, index) => {
  // Table doesn't have a thead element so it will be the first row or index 0
    if (index) {
      coverage_files.push({
        lines_uncovered: parseInt($(row).find('td:nth-child(1)').text().replace(/\n/g, "")),
        coverage: parseFloat($(row).find('td:nth-child(2)').text().replace(/\n/g, "")),
        delta: parseFloat($(row).find('td:nth-child(3)').text().replace(/\n/g, "")),
        file_ref: $(row).find('td:nth-child(4)').text().replace(/\n/g, ""),
        build_ref: build_commit_sha
      })
    }
  })

  return coverage_files;
}

export function scrapeUncoveredLines(file_page: string,file: UncoveredFile): UncoveredLine[] {
  const $ = cheerio.load(file_page)
  const coverage_lines: any[] = [];

  $('.line-uncov').get().map(line => {
    coverage_lines.push({
      line_number: parseInt($(line).siblings('a:first').text()),
      line_text: $(line).parent('.num').siblings('td.src').find('pre').text().trim(),
      file_ref: file.file_ref,
      build_ref: file.build_ref
    })
  })

  return coverage_lines
}