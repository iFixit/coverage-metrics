import { PromisePool } from "@supercharge/promise-pool"
import { LineCoverage, UncoveredLine } from "@prisma/client";
import db from "./prisma/dbClient"

const MAX_LINE_DIFFERENCE = 5

import multibar from "./progressBar"

export async function populateLineCoverage() {
  const lineCoverage = await db.uncoveredLine.findMany({where: {
    build: {
      available: true
    }
  }})
  const backFilledLineCoverage = backFillCounts(lineCoverage);

  return saveLineCoverage(backFilledLineCoverage)
}


async function saveLineCoverage(lineCoverage: LineCoverage[]) {
  const lineCoverageSaveBar = multibar.create(lineCoverage.length, 0, {
    action: 'Saving Line Coverage'
  })

  return PromisePool.for(lineCoverage).withConcurrency(20).process(async line => {
    const result = await db.lineCoverage.upsert({
      where: {
        line_number_line_text: {
          line_number: line.line_number,
          line_text: line.line_text
        }
      },
      update: line,
      create: line
    })

    lineCoverageSaveBar.increment()
    return result
  })
}

function backFillCounts(lineCoverage: UncoveredLine[]){
  const lineCoverageByFile = lineCoverage.reduce(reduceByFile, {})
  const updateLineCoverage: LineCoverage[] = []
  const backFillLineCoverageCountsBar = multibar.create(lineCoverage.length,0,{
    action: "Backfilling Line Coverage Counts"
  })

  for (let file in lineCoverageByFile) {
    const backFilledCounts = new Map()

    lineCoverageByFile[file].map(line => {
      const lineHashKey = line.line_text
      if (!backFilledCounts.has(lineHashKey)) {
        backFilledCounts.set(lineHashKey,
          {
            line_number: line.line_number,
            line_text: line.line_text,
            file_ref: line.file_ref,
            times_uncovered: 1,
            coverage_url: `https://www.ubreakit.com/Misc/coverage-log/current/${line.file_ref}.html#${line.line_number}`
          }
        )
      }
      else if (backFilledCounts.has(lineHashKey) && isLineNumberInCloseProximity(backFilledCounts.get(lineHashKey), line)) {
        const currentLineValues = backFilledCounts.get(lineHashKey)
        backFilledCounts.set(
          lineHashKey,
          {
            ...currentLineValues,
            times_uncovered: currentLineValues.times_uncovered + 1
          }
        )
      }
      else {
        backFilledCounts.set(lineHashKey,
          {
            line_number: line.line_number,
            line_text: line.line_text,
            file_ref: line.file_ref,
            times_uncovered: 1,
            coverage_url: `https://www.ubreakit.com/Misc/coverage-log/current/${line.file_ref}.html#${line.line_number}`
          }
        )
      }
      backFillLineCoverageCountsBar.increment()
    })

    updateLineCoverage.push(...backFilledCounts.values())
  }
  return updateLineCoverage
}

function reduceByFile(coverage_by_file: { [file_ref: string]: UncoveredLine[] }, lineCoverage: UncoveredLine) {
  if (!coverage_by_file[lineCoverage.file_ref]) {
    coverage_by_file[lineCoverage.file_ref] = []
  }
  coverage_by_file[lineCoverage.file_ref].push(lineCoverage)
  return coverage_by_file
}

function isLineNumberInCloseProximity(backedFilledLine: LineCoverage, new_line: UncoveredLine): boolean {
  return Math.abs(backedFilledLine.line_number - new_line.line_number) <= MAX_LINE_DIFFERENCE;
}