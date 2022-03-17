import { Build } from "@prisma/client"
import CoverallsAPIClient from "./coverallsAPI"
import db from "./prisma/dbClient"
import { CoverallsBuild } from "./types"
const coveralls = new CoverallsAPIClient()

import multibar from './progressBar'
import { PromisePool } from "@supercharge/promise-pool"

const NUMBER_OF_BUILDS = 30

export async function populateBuilds() {
  const non_master_builds = await coveralls.getNBuilds(NUMBER_OF_BUILDS)
  const mapped_builds = parseBuildList(non_master_builds)

  return saveParsedBuildList(mapped_builds)
}

function parseBuildList(builds: CoverallsBuild[]): Build[] {
  const parseBuildListBar = multibar.create(builds.length, 0, {
    action: "Parse Build List",
  })

  return builds.map(build => {
    parseBuildListBar.increment()
    return {
      ...build,
      available: true,
      covered_percent: parseFloat(build.covered_percent?.toFixed(2)),
      url: `https://coveralls.io/builds/${build.commit_sha}`
    }
  })
}

async function saveParsedBuildList(builds: Build[]) {
   const buildSaveBar = multibar.create(builds.length, 0, {
    action: 'Saving Builds'
  })

  return PromisePool.for(builds).process(async build => {
    const result = await db.build.upsert({
      where: {
        commit_sha: build.commit_sha
      },
      update: build,
      create: build
    })
    buildSaveBar.increment()
    return result
  })
}