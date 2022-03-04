import CoverallsAPIClient from "./coveralls_api"
import cheerio from "cheerio";

import { CoverallsBuild } from "./types";
import { Build, PrismaClient, UncoveredLines } from '@prisma/client'
const prisma = new PrismaClient()

const coveralls = new CoverallsAPIClient();

(async () => {
  // const non_master_builds = await coveralls.getNBuilds(2)
  // // console.log(non_master_builds)

  // const mapped_builds = parseBuildList(non_master_builds);

  const build_page = await coveralls.getBuildPageByCommitSHA("e8f5cdd1f76429b4257f7c930bc4edb85f7ebcc5").catch(error => {
      console.log(`Page for commit e8f5cdd1f76429b4257f7c930bc4edb85f7ebcc5 may no longer exist will remove from build list`);
  })

  const $ = cheerio.load(build_page)
  const coverage_files: any[] = []


  $('.missed-lines tr').get().map((row, index) => {
    // Table doesn't have a thead element so it will be the first row
    if (index) {
      coverage_files.push({
        lines_uncovered: parseInt($(row).find('td:nth-child(1)').text().replace(/\n/g, "")),
        coverage: parseFloat($(row).find('td:nth-child(2)').text().replace(/\n/g, "")),
        delta: parseFloat($(row).find('td:nth-child(3)').text().replace(/\n/g, "")),
        file: $(row).find('td:nth-child(4)').text().replace(/\n/g, ""),
        build_ref: "e8f5cdd1f76429b4257f7c930bc4edb85f7ebcc5"
      })
    }
  })

  await prisma.uncoveredLines.createMany({
    data: coverage_files
  })
})();

function parseBuildList(builds: CoverallsBuild[]): Build[] {
  return builds.map(build => {
    return {
      ...build,
      url: `https://coveralls.io/builds/${build.commit_sha}`
    }
  })
}