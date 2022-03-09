import { PromisePool } from "@supercharge/promise-pool"
import { FileCoverage } from "@prisma/client";
import CoverallsAPIClient from "./coverallsAPI"
import { CoverallsFileCoverage } from "./types";
import db from "./prisma/dbClient"

const coveralls = new CoverallsAPIClient();
import multibar from './progressBar'


export async function populateFileCoverage(){
  const master_build = await coveralls.getFirstMasterBuild()
  const source_file_coverage: CoverallsFileCoverage[] = await coveralls.getAllSourceFilesCoverage(master_build.commit_sha)

  const mapped_file_coverage = parseFileCoverage(source_file_coverage)
  return saveParsedFileList(mapped_file_coverage)
}

function parseFileCoverage(file_coverage: CoverallsFileCoverage[]): FileCoverage[] {
  const parseFileListBar = multibar.create(file_coverage.length, 0, {
    action: 'Parse Source Files Coverages'
  })

  return file_coverage.map((file: CoverallsFileCoverage) => {
    parseFileListBar.increment()
    return {
      file: file.name,
      times_coverage_changed: 0,
      current_coverage: parseFloat(file.covered_percent.toFixed(2)),
      coverage_url: `https://www.ubreakit.com/Misc/coverage-log/current/${file.name}.html`
    }
  })
}

async function saveParsedFileList(files: FileCoverage[]) {
   const fileSaveBar = multibar.create(files.length, 0, {
    action: 'Saving Source Files Coverages'
  })

  return PromisePool.for(files).withConcurrency(20).process(async file => {
    const result = await db.fileCoverage.upsert({
      where: {
        file: file.file,
      },
      update: {
        current_coverage: file.current_coverage,
        coverage_url: file.coverage_url
      },
      create: file
    })
    fileSaveBar.increment()
    return result
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
  const uncoveredFiles = await db.uncoveredFile.groupBy({
    by: ['file_ref'],
    _count: {
      file_ref: true
    }
  })

  const backFillFileCoverageCountsBar = multibar.create(uncoveredFiles.length, 0, {
    action: 'Backfilling File Coverage Counts'
  })

  return PromisePool.for(uncoveredFiles).process(async uncoveredFile => {
    const result = await db.fileCoverage.update({
      where: {
        file: uncoveredFile.file_ref
      },
      data: {
        times_coverage_changed: uncoveredFile._count.file_ref
      }
    })
    backFillFileCoverageCountsBar.increment()
    return result
  })
}