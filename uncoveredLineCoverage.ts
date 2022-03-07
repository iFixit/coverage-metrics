import { UncoveredFile, UncoveredLine } from "@prisma/client";
import CoverallsAPIClient from "./coveralls_api"
import db from "./prisma/dbClient"
import { scrapeUncoveredLines } from "./scraper";

const coveralls = new CoverallsAPIClient()

export async function populateUncoveredLines() {
 const uncoveredFiles = await db.uncoveredFile.findMany({
    where: {
      build: {
        available: true
      }
    }
 })

  const lineCoverage = await getUncoveredLinesFromFiles(uncoveredFiles)

  await db.uncoveredLine.createMany({
    data: lineCoverage,
    skipDuplicates: true
  })
}


async function getUncoveredLinesFromFiles(uncoveredFiles: UncoveredFile[]) {
  const lineCoverage: UncoveredLine[] = []
  for (let file of uncoveredFiles) {
    console.log('Getting Lines for File: ' + file.file_ref)

    const coverage_page = await coveralls.getFileCoverage(file.build_ref, file.file_ref)

    const fileCoverage = scrapeUncoveredLines(coverage_page, file)
    lineCoverage.push(...fileCoverage)
  }
  return lineCoverage
}