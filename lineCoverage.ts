import { LineCoverage, UncoveredLines } from "@prisma/client";
import CoverallsAPIClient from "./coveralls_api"
import db from "./prisma/dbClient"
import { scrapeUncoveredLines } from "./scraper";

const coveralls = new CoverallsAPIClient();

async function populateLineCoverage(){
  const uncoveredLines = await db.uncoveredLines.findMany({
    where: {
      build: {
        available: true
      }
    }
  })

  const lineCoverage = await getUncoveredLinesFromFiles(uncoveredLines)

  const backFilledLineCoverage = backFillCounts(lineCoverage);

  await db.lineCoverage.createMany({
    data: backFilledLineCoverage,
    skipDuplicates: true
  })
}

async function getUncoveredLinesFromFiles(uncoveredLines: UncoveredLines[]) {
  const lineCoverage: LineCoverage[] = []
  for (let line of uncoveredLines) {
    const coverage_page = await coveralls.getFileCoverage(line.build_ref,line.file_ref)

    const fileCoverage = scrapeUncoveredLines(coverage_page, line.file_ref)
    lineCoverage.push(...fileCoverage)
  }
  return lineCoverage
}

function backFillCounts(lineCoverage: LineCoverage[]){
  const lineCoverageByFile = lineCoverage.reduce(reduceByFile, {})
  const updateLineCoverage: LineCoverage[] = []

  for (let file in lineCoverageByFile) {
    const backFilledCounts = new Map()

    lineCoverageByFile[file].map(line => {
      const lineHashKey = line.line_number+line.line_text
      if (!backFilledCounts.has(lineHashKey)) {
        backFilledCounts.set(lineHashKey,line)
      }
      else {
        const currentLineValues = backFilledCounts.get(lineHashKey)
        backFilledCounts.set(lineHashKey,{...currentLineValues, times_uncovered: currentLineValues.times_uncovered+1})
      }
    })
    updateLineCoverage.push(...backFilledCounts.values())
  }
  return updateLineCoverage
}

function reduceByFile(coverage_by_file: { [file_ref: string]: LineCoverage[] }, lineCoverage: LineCoverage) {
  if (!coverage_by_file[lineCoverage.file_ref]) {
    coverage_by_file[lineCoverage.file_ref] = []
  }
  coverage_by_file[lineCoverage.file_ref].push(lineCoverage)
  return coverage_by_file
}

populateLineCoverage()
