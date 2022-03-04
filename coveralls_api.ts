import { CoverallsBuild, CoverallsFileCoverage } from "./types"
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import dotenv from "dotenv";

dotenv.config();

declare module 'axios' {
  interface AxiosResponse<T = any> extends Promise<T> {}
}

export default class CoverallsAPIClient {
  protected readonly instance: AxiosInstance;
  baseURL: string = 'https://coveralls.io'

  public constructor() {
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 5000 // Timeout quickly since some pages no longer exist
    });

    this._initializeResponseInterceptor();
  }

  private _initializeResponseInterceptor = () => {
    this.instance.interceptors.response.use(
      this._handleResponse,
      this._handleError,
    );
  };

  // Deconstruct response to return just the data
  private _handleResponse = ({ data }: AxiosResponse) => data;
  protected _handleError = (error: any) => Promise.reject(error);

  public async getBuildsFromPage(page: number) {
    return this.instance.get('/github/iFixit/ifixit.json', { params: {repo_token: process.env.COVERALLS_REPO_TOKEN, page: page} })
  }

  // Will only get non-master builds
  public async getNBuilds(count: number): Promise<CoverallsBuild[]> {
    let builds: CoverallsBuild[] = []
    for (let current_page = 1; builds.length < count; current_page++){
      const response = await this.getBuildsFromPage(current_page)
      const filtered_builds = this.filterNonMasterBuilds(response.builds)
      builds = builds.concat(filtered_builds)
    }
    return builds
  }

  public async getBuildPageByCommitSHA(commit_sha: string) {
    return this.instance.get(`builds/${commit_sha}`, { params: { repo_token: process.env.COVERALLS_REPO_TOKEN } })
  }

  public async getFileCoverage(commit_sha: string, file_path: string) {
    return this.instance.get(`builds/${commit_sha}/source`,{ params: { repo_token: process.env.COVERALLS_REPO_TOKEN, filename: file_path} })
  }

  // We can probably atttach a webhook later to automatically retrieve the latest build for master

  // Actually need to get the second master build since the first one may still be pending
  public async getFirstMasterBuild() {
    let first_build_found = false
    for (let current_page = 1; ; current_page++) {
      const response = await this.getBuildsFromPage(current_page)
      const master_build = response.builds.find(build => build.branch === 'master')
      if (master_build && first_build_found) {
        return master_build
      }
      else if (master_build) {
        first_build_found = true
      }
    }
  }

  public async getAllSourceFilesCoverage(commit_sha: string): Promise<CoverallsFileCoverage[]> {
    let source_file_coverage = []
    const response = await this.getSourceFilesCoverageAtPage(commit_sha,1)
    source_file_coverage = source_file_coverage.concat(JSON.parse(response.source_files))
    const total_pages = response.total_pages

    for (let current_page = 2; current_page <= total_pages; current_page++){
      const response = await this.getSourceFilesCoverageAtPage(commit_sha,current_page)
      source_file_coverage = source_file_coverage.concat(JSON.parse(response.source_files))
    }
    return source_file_coverage
  }

  private filterNonMasterBuilds(builds: CoverallsBuild[]) {
    return builds.filter(build => {
      if (build.branch !== 'master') {
        return build
    }
    })
  }

  private getSourceFilesCoverageAtPage(commit_sha: string, page: number) {
     return this.instance.get(`builds/${commit_sha}/source_files.json`,{ params: { repo_token: process.env.COVERALLS_REPO_TOKEN, page: page} })
  }
}