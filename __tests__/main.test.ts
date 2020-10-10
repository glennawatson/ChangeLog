import {IGitSourceSettings} from '../src/git-source-settings';
import {CommitHelper} from '../src/commit-helper';
import * as inputHelper from '../src/input-helper';

test('gets valid commits', async () => {
  jest.setTimeout(100000);

  var input = inputHelper.getInputs();
  var commitHelper = new CommitHelper(input);

  var results = await commitHelper.getCommitList();

  expect(results.length).toBeGreaterThan(0);
});
