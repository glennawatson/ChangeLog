import * as core from '@actions/core';
import * as inputHelper from './input-helper';
import * as releaseHelper from './commit-helper';

async function run(): Promise<void> {
  try {
    const sourceSettings = inputHelper.getInputs();

    core.debug(
      `${sourceSettings.commit} - ${sourceSettings.ref} - ${sourceSettings.repositoryName} - ${sourceSettings.repositoryOwner}`
    );

    const commitHelper = new releaseHelper.CommitHelper(sourceSettings);

    const commitLog = await commitHelper.getCommitList();

    core.setOutput('commitLog', commitLog.join('\n'));
  } catch (error) {
    core.setFailed(`There is a weird error ${error.message} ${error.stack}`);
  }
}

run();
