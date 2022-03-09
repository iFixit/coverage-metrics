import { PromisePool } from "@supercharge/promise-pool"
import { Build, UncoveredFile } from "@prisma/client";
import CoverallsAPIClient from "./coverallsAPI"
import db from "./prisma/dbClient"
import { scrapeUncoveredFiles } from "./scraper";

const coveralls = new CoverallsAPIClient()
import multibar from './progressBar'

export async function populateUncoveredFiles() {
  const builds = await db.build.findMany({ where: { available: true } })
  const coverage_files = await getCoverageFilesForBuilds(builds);

  return saveParsedFileCoverage(coverage_files)
}

async function getCoverageFilesForBuilds(builds: Build[]){
  const coverage_files: any[] = [];
  const getCoverageFilesBar = multibar.create(builds.length, 1, {
    action: "Getting Coverage Files for Each Build"
  })

  await PromisePool.for(builds).withConcurrency(20).process(async build => {
    const build_page = await coveralls.getBuildPageByCommitSHA(build.commit_sha).catch(async error => {
        await db.build.update({
          where: {
            commit_sha: build.commit_sha
          },
          data: {
            available: false
          }
        })
      })

    if (build_page !== undefined) {
      coverage_files.push(...scrapeUncoveredFiles(build_page, build.commit_sha))
    }
    getCoverageFilesBar.increment()
  })

  return coverage_files
}

async function saveParsedFileCoverage(coverage_files: UncoveredFile[]){
  const fileCoverageSaveBar = multibar.create(coverage_files.length, 0, {
    action: 'Saving File Coverages'
  })

  return PromisePool.for(coverage_files).process(async file => {
    const result =  await db.uncoveredFile.upsert({
      where: {
        build_ref_file_ref: {
          build_ref: file.build_ref,
          file_ref: file.file_ref
        }
      },
      update: file,
      create: file
    })
    fileCoverageSaveBar.increment()
    return result
  })
}