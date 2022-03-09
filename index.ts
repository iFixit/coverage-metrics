import { populateBuilds } from "./buildCoverage";
import { appendCoverageURL, backFillFileCoverageCounts, populateFileCoverage } from "./fileCoverage";
import { populateLineCoverage } from "./lineCoverage";
import { populateUncoveredFiles } from "./uncoveredFileCoverage";
import { populateUncoveredLines } from "./uncoveredLineCoverage";

import multibar from "./progressBar"

const FIFTEEN_MINUTES = 15 * 60 * 1000;
(async () => {
  await main()
  setInterval(main, FIFTEEN_MINUTES)
})();

async function main() {
  console.log('\n================================Starting Population================================\n')

  await populateBuilds()

  await populateFileCoverage()

  await populateUncoveredFiles()

  await backFillFileCoverageCounts()

  await appendCoverageURL()

  await populateUncoveredLines()

  await populateLineCoverage()

  console.log('\n================================Finished Populating================================\n')
}