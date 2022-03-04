import CoverallsAPIClient from "./coveralls_api"
import cheerio from "cheerio";

import { CoverallsBuild } from "./types";
import { Build, PrismaClient, UncoveredLines } from '@prisma/client'
const prisma = new PrismaClient()

const coveralls = new CoverallsAPIClient();

(async () => {
  const non_master_builds = await coveralls.getNBuilds(10)
  const mapped_builds = parseBuildList(non_master_builds);

  await prisma.build.createMany({data: mapped_builds, skipDuplicates: true});

  const coverage_files = await getCoverageFilesForBuilds(mapped_builds);

  await prisma.uncoveredLines.createMany({
    data: coverage_files,
    skipDuplicates: true
  })
})();

async function getCoverageFilesForBuilds(builds: Build[]): Promise<any[]> {
  const coverage_files: any[] = [];

  for(let build of builds) {
    const build_page = await coveralls.getBuildPageByCommitSHA(build.commit_sha).catch(error => {
      console.log(`Page for commit ${build.commit_sha} may no longer exist should remove from build list`);
    })

    if (build_page === undefined) {
      continue
    }
    const $ = cheerio.load(build_page)
    $('.missed-lines:last').find('tr').get().map((row, index) => {
    // Table doesn't have a thead element so it will be the first row
      if (index) {
        coverage_files.push({
          lines_uncovered: parseInt($(row).find('td:nth-child(1)').text().replace(/\n/g, "")),
          coverage: parseFloat($(row).find('td:nth-child(2)').text().replace(/\n/g, "")),
          delta: parseFloat($(row).find('td:nth-child(3)').text().replace(/\n/g, "")),
          file: $(row).find('td:nth-child(4)').text().replace(/\n/g, ""),
          build_ref: build.commit_sha
        })
      }
    })
  }

  return coverage_files
}

function parseBuildList(builds: CoverallsBuild[]): Build[] {
  return builds.map(build => {
    return {
      ...build,
      url: `https://coveralls.io/builds/${build.commit_sha}`
    }
  })
}