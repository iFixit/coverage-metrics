import { Build } from "@prisma/client"
import CoverallsAPIClient from "./coveralls_api"
import db from "./prisma/dbClient"
import { CoverallsBuild } from "./types"
const coveralls = new CoverallsAPIClient()

const NUMBER_OF_BUILDS = 100

export async function populateBuilds(){
  const non_master_builds = await coveralls.getNBuilds(NUMBER_OF_BUILDS)
  const mapped_builds = parseBuildList(non_master_builds)

  await db.build.createMany({
    data: mapped_builds,
    skipDuplicates: true
  })
}

function parseBuildList(builds: CoverallsBuild[]): Build[] {
  return builds.map(build => {
    return {
      ...build,
      available: true,
      url: `https://coveralls.io/builds/${build.commit_sha}`
    }
  })
}