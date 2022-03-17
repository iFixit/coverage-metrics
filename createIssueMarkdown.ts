import db from "./prisma/dbClient"
import fs from "fs"

import { createFlakyFileMDRow, createFlakyLineMDRow, createSubIssueFileMDRow, epicTemplate,subIssueTemplate } from "./issueTemplates";

const outputDir = "./issueMarkdowns";
const epicIssuePath = `${outputDir}/epic.md`;
const subIssuePath = (issueName:string) => {
  const serializedFileName = issueName.replace(/\//g, '_')
  return `${outputDir}/${serializedFileName}.md`
};

(async () => {
  const topTenFlakyFiles = await getTopNFlakyFiles(10)

  const fileCoverageMD = topTenFlakyFiles.map(file => createFlakyFileMDRow(file)).join('\n')
  const subFileIssueMD = topTenFlakyFiles.map(file => createSubIssueFileMDRow(file)).join('\n')

  const epicIssueMD = epicTemplate(fileCoverageMD,subFileIssueMD)
  fs.writeFileSync(epicIssuePath, epicIssueMD)

  for (const file of topTenFlakyFiles) {
    const fileLines = await getFlakyLinesWithBuildURLFromFile(file.file)
    const linesMD = fileLines.map(line => createFlakyLineMDRow(line)).join('\n');
    const subIssueMD = subIssueTemplate(file.file, linesMD)
    fs.writeFileSync(subIssuePath (file.file), subIssueMD)
  }

  console.log('Done Generating Issue Markdown Files')
})()


async function getTopNFlakyFiles(limit: number){
  return await db.fileCoverage.findMany({
    select: {
      file: true,
      times_coverage_changed: true,
      current_coverage: true,
      coverage_url: true
    },
    orderBy: {
      times_coverage_changed: 'desc'
    },
    take: limit
  })
}

async function getFlakyLinesWithBuildURLFromFile(file_name:string) {
  const flaky_lines = await getFlakyLinesOfFile(file_name)
  const flaky_lines_with_build: any[] = []
  for (const line of flaky_lines) {
    const build_ref = await getFlakyLinesBuildReference(line.line_number, line.line_text, file_name)
    flaky_lines_with_build.push({
      ...line,
      build_ref: `https://github.com/iFixit/ifixit/blob/${build_ref}/${file_name}#L${line.line_number}`
    })
  }
  return flaky_lines_with_build
}

async function getFlakyLinesOfFile(file_name: string) {
  return await db.lineCoverage.findMany({
    where: {
      file_ref: {
        equals: file_name
      }
    },
    orderBy: {
      times_uncovered: 'desc'
    }
  })
}

async function getFlakyLinesBuildReference(line_number: number, line_text:string, file_name: string) {
  const obj = await db.uncoveredLine.findFirst({
    where: {
      line_number: line_number,
      line_text: line_text,
      file_ref: file_name
    },
    select: {
      build_ref: true
    }
  })
  return obj?.build_ref
}
