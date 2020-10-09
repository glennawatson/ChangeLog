export interface IGitSourceSettings {
  /**
   * The repository owner
   */
  repositoryOwner: string;

  /**
   * The repository name
   */
  repositoryName: string;

  /**
   * The ref to fetch
   */
  ref: string;

  /**
   * The commit to checkout
   */
  commit: string;

  /**
   * The auth token to use when fetching the repository
   */
  authToken: string;
}
