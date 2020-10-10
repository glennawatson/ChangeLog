# ChangeLog

GitHub Action for generating change logs. Fully based on TypeScript so will work on multiple targets not just linux. Based on the [azure devops task](https://github.com/microsoft/azure-pipelines-tasks/blob/e7769b150b919695f76369da636f65532689c50d/Tasks/GitHubReleaseV1/operations/ChangeLog.ts#L1).

It is slightly different from the azure in terms of it will detect different prefixes and place related commits under group headings.

## Example workflow - create a release
Generate changelog from git commits and use it as the body for the GitHub release.

```yaml
on:
  push:
    # Sequence of patterns matched against refs/tags
    tags:
      - 'v*' # Push events to matching v*, i.e. v1.0, v20.15.10

name: Create Release

jobs:
  build:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
    - name: Changelog
      uses: glennawatson/ChangeLog@v1
      id: changelog

    - name: Create Release
      uses: actions/create-release@v1
      env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # This token is provided by Actions, you do not need to create your own token
      with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            ${{ steps.Changelog.outputs.changelog }}
```

## Commit Prefixes

One is a special case for Dependabot, if the author of the commit is `@dependabot-preview` then `Dependencies` will be the group header.

| Prefix | Release Note Header |
| --- | --- |
| feature | Features |
| feat | Features |
| docs | Documentation |
| style | Style Changes |
| perf | Performance |
| test | Test |
| refactor | Refactoring |
| housekeeping | Housekeeping |
| fix | Fixes |
| bug | Bug Fixes |

## Inputs

All inputs are optional.
| Input | Description | Default Value|
| --- | --- | --- |
| token | Personal access token (PAT) used to fetch the repository. The PAT is configured with the local git config, which enables your scripts to run authenticated git commands. The post-job step removes the PAT. We recommend using a service account with the least permissions necessary. Also when generating a new PAT, select the least scopes necessary.[Learn more about creating and using encrypted secrets](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets) | `${{ github.token }}` |
| ref | The branch, tag or SHA to checkout. When checking out the repository that triggered a workflow, this defaults to the reference or SHA for that event.  Otherwise, uses the default branch. | |
| repository | description: 'Repository name with owner. For example, glennawatson/ChangeLog' | `${{ github.repository }}` |

## Outputs

| Output | Description |
| --- | --- |
| changelog | The generated change log |
