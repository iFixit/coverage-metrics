import { FileCoverage } from "@prisma/client";
import CoverallsAPIClient from "./coveralls_api"
import { CoverallsFileCoverage } from "./types";
import db from "./prisma/dbClient"

const coveralls = new CoverallsAPIClient();

async function populateFileCoverage(){
  const master_build = await coveralls.getFirstMasterBuild()
  const source_file_coverage: CoverallsFileCoverage[] = await coveralls.getAllSourceFilesCoverage(master_build.commit_sha)

  const mapped_file_coverage = parseFileCoverage(source_file_coverage)

  const BATCH_SIZE: number = 200
  for (let batch = 0; batch <= mapped_file_coverage.length; batch += BATCH_SIZE) {
    await db.fileCoverage.createMany({
        data: mapped_file_coverage.slice(batch, batch? batch + BATCH_SIZE: BATCH_SIZE),
        skipDuplicates: true
      })
  }

  await backFillCounts()
}

function parseFileCoverage(file_coverage: CoverallsFileCoverage[]):FileCoverage[] {
  return file_coverage.map((file:CoverallsFileCoverage) => {
    return {
      file: file.name,
      times_coverage_changed: 0,
      current_coverage: parseFloat(file.covered_percent.toFixed(2))
    }
  })
}

async function backFillCounts() {
  const uncoveredLines = await db.uncoveredLines.groupBy({
    by: ['file_ref'],
      _count: {
      file_ref: true
    }
  })

  for (let file of uncoveredLines) {
    await db.fileCoverage.update({
      where: {
        file: file.file_ref
      },
      data: {
        times_coverage_changed: file._count.file_ref
      }
    })
  }
}