export type CoverallsBuild = {
  created_at: string,
  url: null,
  commit_message: string,
  branch: string,
  committer_name: string,
  committer_email: string,
  commit_sha: string,
  repo_name: string,
  badge_url: string,
  coverage_change: number
  covered_percent: number
}

export type CoverallsFileCoverage = {
  name: string,
  relevant_line_count: number,
  covered_line_count: number,
  missed_line_count: number,
  covered_percent: number
}