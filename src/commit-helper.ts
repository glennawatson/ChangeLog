import * as core from '@actions/core';
import * as github from '@actions/github';
import {IGitSourceSettings} from './git-source-settings';

export class CommitHelper {
  private _githubClient;
  private _inputSettings: IGitSourceSettings;

  public constructor(inputSettings: IGitSourceSettings) {
    this._githubClient = github.getOctokit(inputSettings.authToken);
    this._inputSettings = inputSettings;
  }

  public async getCommitList(): Promise<string[]> {
    const endCommit = this._inputSettings.commit;

    const startCommit = await this.getLastReleaseCommitId();

    core.debug(`The start commit is ${startCommit} and end commit is ${endCommit}`);

    const commitsResponse = await this._githubClient.repos.compareCommits({
      owner: this._inputSettings.repositoryOwner,
      repo: this._inputSettings.repositoryName,
      base: startCommit,
      head: endCommit
    });

    if (commitsResponse.status !== 200) {
      throw new Error('could not find valid commits in a comparison.');
    }

    let responses = new Map<string, string[]>();

    for (const commit of commitsResponse.data.commits || []) {
      let message = commit.commit.message;

      // only show first line of commit message to keep output clean
      const newline = message.indexOf('\n');
      if (newline > -1) {
        message = message.substr(0, newline);
      }

      let author = commit.author ? `@${commit.author.login}` : null;
      if (author == null) {
        // use the name from the commit itself if we cannot find a GitHub committer
        author = commit.commit.author.name;
      }

      const commitLine = ` * ${commit.sha} ${message} ${author}`;
      this.mapItems(author, responses, commitLine, message);
    }

    const response: string[] = new Array<string>();

    responses = new Map(
      [...responses].sort(
        (a, b) => (a[0] > b[0] && 1) || (a[0] === b[0] ? 0 : -1)
      )
    );

    for (const [key, value] of responses) {
      response.push(`## ${key}:`);

      for (const line of value) {
        response.push(line);
      }

      response.push('');
    }

    return response;
  }

  private mapItems(
    author: string,
    responses: Map<string, string[]>,
    commitLine: string,
    message: string
  ): void {
    if (this.startsWithCaseInsensitive(author, '@dependabot-preview')) {
      this.addItemToResponse(responses, 'Dependencies', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'feature')) {
      this.addItemToResponse(responses, 'Features', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'feat')) {
      this.addItemToResponse(responses, 'Features', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'docs')) {
      this.addItemToResponse(responses, 'Documentation', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'style')) {
      this.addItemToResponse(responses, 'Style Changes', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'perf')) {
      this.addItemToResponse(responses, 'Performance', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'test')) {
      this.addItemToResponse(responses, 'Test', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'refactor')) {
      this.addItemToResponse(responses, 'Refactoring', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'housekeeping')) {
      this.addItemToResponse(responses, 'Housekeeping', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'fix')) {
      this.addItemToResponse(responses, 'Fixes', commitLine);
    } else if (this.startsWithCaseInsensitive(message, 'bug')) {
      this.addItemToResponse(responses, 'Bug Fixes', commitLine);
    } else {
      this.addItemToResponse(responses, 'Other', commitLine);
    }
  }

  private startsWithCaseInsensitive(source: string, target: string): boolean {
    const length = target.length;

    const slice = source.slice(0, length);

    return slice.toLowerCase().startsWith(target);
  }

  private addItemToResponse(
    items: Map<string, string[]>,
    key: string,
    element: string
  ): void {
    if (items.has(key)) {
      let keyItems = items.get(key);

      if (keyItems == null) {
        keyItems = new Array<string>();
        items.set(key, keyItems);
      }

      keyItems?.push(element);
    } else {
      const keyItems = new Array<string>();
      items.set(key, keyItems);
      keyItems.push(element);
    }
  }

  private async getLastReleaseCommitId(): Promise<string> {
    let startCommitSha: string;

    try {
      const latestReleaseResponse = await this._githubClient.repos.getLatestRelease(
        {
          owner: this._inputSettings.repositoryOwner,
          repo: this._inputSettings.repositoryName
        }
      );

      if (
        latestReleaseResponse.status !== 200 &&
        latestReleaseResponse.status !== 404
      ) {
        throw new Error('Did not get a valid response for the latest release.');
      } else if (
        latestReleaseResponse.status !== 404 &&
        !!latestReleaseResponse.data.tag_name
      ) {
        const refResult = await this._githubClient.git.getRef({
          owner: this._inputSettings.repositoryOwner,
          repo: this._inputSettings.repositoryName,
          ref: `tags/${latestReleaseResponse.data.tag_name}`
        });
        if (refResult.status !== 200) {
          throw new Error(`Did not get a valid response about the reference.`);
        }

        startCommitSha = refResult.data.object.sha;
      } else {
        return await this.getInitialCommit();
      }
    } catch (e) {
      return await this.getInitialCommit();
    }

    return startCommitSha;
  }

  private async getInitialCommit(): Promise<string> {
    try {
      const response = await this._githubClient.paginate(
        this._githubClient.repos.listCommits,
        {
          owner: this._inputSettings.repositoryOwner,
          repo: this._inputSettings.repositoryName,
          per_page: 100
        }
      );
      return response[response.length - 1].sha;
    } catch (e) {
      throw new Error(`Could not get a list of commits. ${e.message}`);
    }
  }
}
