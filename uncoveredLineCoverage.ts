import { PromisePool } from "@supercharge/promise-pool"
import { UncoveredFile, UncoveredLine } from "@prisma/client";
import CoverallsAPIClient from "./coverallsAPI"
import db from "./prisma/dbClient"
import { scrapeUncoveredLines } from "./scraper";

const coveralls = new CoverallsAPIClient()

import multibar from "./progressBar"

export async function populateUncoveredLines() {
 const uncoveredFiles = await db.uncoveredFile.findMany({
    where: {
      build: {
        available: true
      }
    }
 })
  const lineCoverage = await getUncoveredLinesFromFiles(uncoveredFiles)
  return saveParsedUncoveredLines(lineCoverage)
}


async function getUncoveredLinesFromFiles(uncoveredFiles: UncoveredFile[]) {
  const lineCoverage: UncoveredLine[] = []
  const getUncoveredLinesBar = multibar.create(uncoveredFiles.length, 0, {
    action: "Getting Uncovered Lines",
  })

  await PromisePool.for(uncoveredFiles).withConcurrency(5).process(async file => {
    const coverage_page = await coveralls.getFileCoverage(file.build_ref, file.file_ref)
    lineCoverage.push(...scrapeUncoveredLines(coverage_page, file))
    getUncoveredLinesBar.increment()
  })

  return lineCoverage
}

async function saveParsedUncoveredLines(uncoveredLines: UncoveredLine[]) {
    const uncoveredLinesSaveBar = multibar.create(uncoveredLines.length, 0, {
    action: 'Saving Uncovered Lines'
  })

  return PromisePool.for(uncoveredLines).process(async uncoveredLine => {
    const result =  await db.uncoveredLine.upsert({
      where: {
        line_number_line_text: {
          line_number: uncoveredLine.line_number,
          line_text: uncoveredLine.line_text
        }
      },
      update: uncoveredLine,
      create: uncoveredLine
    })
    uncoveredLinesSaveBar.increment()
    return result
  })
}