
export const epicTemplate = (fileCoverageMD, subFileIssueMD) => `
# Description:

Here are the top 10 flaky files -- _this was automatically generated_


| File  | Times Uncovered | Current Coverage Percentage | Ubreakit Coverage Report |
|---|---|---|---|
${fileCoverageMD}

---

### File Issues:

${subFileIssueMD}
`


export const subIssueTemplate = (file_name: string, linesMD) => `
# Description:

[\`${file_name}\`](https://github.com/iFixit/ifixit/blob/master/${file_name})

| Line Number | Code  | Times Uncovered | Ubreakit Report | Reference Commit |
|---|---|---|---|---|
${linesMD}
`


export function createFlakyFileMDRow(rowValues) {
  return `|${rowValues.file}|${rowValues.times_coverage_changed}|${rowValues.current_coverage}|[${rowValues.file}](${rowValues.coverage_url})|`
}

export function createSubIssueFileMDRow(rowValues) {
  return `- [ ] Deflake Coverage: \`${rowValues.file}\``
}

export function createFlakyLineMDRow(rowValues) {
  return `|${rowValues.line_number}|${rowValues.line_text}|${rowValues.times_uncovered}|${rowValues.coverage_url}|${rowValues.build_ref}`
}