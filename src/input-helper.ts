import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'path';
import {IGitSourceSettings} from './git-source-settings';

export function getInputs(): IGitSourceSettings {
  const result = ({} as unknown) as IGitSourceSettings;

  result.authToken = core.getInput('token');

  const qualifiedRepository =
    core.getInput('repository') ||
    `${github.context.repo.owner}/${github.context.repo.repo}`;
  // Workflow repository?
  const isWorkflowRepository =
    qualifiedRepository.toUpperCase() ===
    `${github.context.repo.owner}/${github.context.repo.repo}`.toUpperCase();

  const splitRepository = qualifiedRepository.split('/');
  if (
    splitRepository.length !== 2 ||
    !splitRepository[0] ||
    !splitRepository[1]
  ) {
    throw new Error(
      `Invalid repository '${qualifiedRepository}'. Expected format {owner}/{repo}.`
    );
  }

  result.repositoryOwner = splitRepository[0];
  result.repositoryName = splitRepository[1];

  // Source branch, source version
  result.ref = core.getInput('ref');

  if (!result.ref) {
    if (isWorkflowRepository) {
      result.ref = github.context.ref;
      result.commit = github.context.sha;

      // Some events have an unqualifed ref. For example when a PR is merged (pull_request closed event),
      // the ref is unqualifed like "main" instead of "refs/heads/main".
      if (result.commit && result.ref && !result.ref.startsWith('refs/')) {
        result.ref = `refs/heads/${result.ref}`;
      }
    }
  }
  // SHA?
  else if (result.ref.match(/^[0-9a-fA-F]{40}$/)) {
    result.commit = result.ref;
    result.ref = '';
  }

  core.debug(`ref = '${result.ref}'`);
  core.debug(`commit = '${result.commit}'`);

  return result;
}
