import { FileCoverage } from "@prisma/client";
import CoverallsAPIClient from "./coveralls_api"
import { CoverallsFileCoverage } from "./types";
import db from "./prisma/dbClient"

const coveralls = new CoverallsAPIClient();

export async function populateFileCoverage(){
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
}

function parseFileCoverage(file_coverage: CoverallsFileCoverage[]):FileCoverage[] {
  return file_coverage.map((file:CoverallsFileCoverage) => {
    return {
      file: file.name,
      times_coverage_changed: 0,
      current_coverage: parseFloat(file.covered_percent.toFixed(2)),
      coverage_url: `https://www.ubreakit.com/Misc/coverage-log/current/${file.name}.html`
    }
  })
}

export async function appendCoverageURL() {
  const files = await db.fileCoverage.findMany()

  for (let file of files) {
    await db.fileCoverage.update({
      where: {
        file: file.file
      },
      data: {
        coverage_url: `https://www.ubreakit.com/Misc/coverage-log/current/${file.file}.html`
      }
    })
  }
}

export async function backFillFileCoverageCounts() {
  const uncoveredLines = await db.uncoveredFile.groupBy({
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