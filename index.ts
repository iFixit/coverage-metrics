import { populateBuilds } from "./buildCoverage";
import { appendCoverageURL, backFillFileCoverageCounts, populateFileCoverage } from "./fileCoverage";
import { populateLineCoverage } from "./lineCoverage";
import { populateUncoveredFiles } from "./uncoveredFileCoverage";
import { populateUncoveredLines } from "./uncoveredLineCoverage";

(async () => {
  await populateBuilds()
  await populateFileCoverage()
  console.log("Populating Uncovered Files")
  await populateUncoveredFiles()
  console.log("Back Filling File Coverage Counts")
  await backFillFileCoverageCounts()
  await appendCoverageURL()
  console.log("Populate Uncovered Lines")
  await populateUncoveredLines()
  console.log("Populate Line Coverage")
  await populateLineCoverage()
})();