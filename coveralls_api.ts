import { CoverallsBuild } from "./types"
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

  private filterNonMasterBuilds(builds: CoverallsBuild[]) {
    return builds.filter(build => {
      if (build.branch !== 'master') {
        return build
    }
    })
  }
}