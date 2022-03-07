import { Build } from "@prisma/client";
import CoverallsAPIClient from "./coveralls_api"
import db from "./prisma/dbClient"
import { scrapeUncoveredFiles } from "./scraper";

const coveralls = new CoverallsAPIClient()

export async function populateUncoveredFiles() {
  const builds = await db.build.findMany({ where: { available: true } })
  const coverage_files = await getCoverageFilesForBuilds(builds);

  await db.uncoveredFile.createMany({
    data: coverage_files,
    skipDuplicates: true
  })
}

async function getCoverageFilesForBuilds(builds: Build[]): Promise<any[]> {
  const coverage_files: any[] = [];

  for (let build of builds) {
    console.log('Getting Files for Build ' + build.commit_sha)
    const build_page = await coveralls.getBuildPageByCommitSHA(build.commit_sha).catch(async error => {
      await db.build.update({
        where: {
          commit_sha: build.commit_sha
        },
        data: {
          available: false
        }
      })
      console.log(`Page for commit ${build.commit_sha} may no longer exist will set available cell to false`);
    })

    if (build_page === undefined) {
      continue
    }

    coverage_files.push(...scrapeUncoveredFiles(build_page, build.commit_sha))
  }

  return coverage_files
}