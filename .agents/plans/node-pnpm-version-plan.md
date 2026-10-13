# Node and pnpm version plan

Date: 2026-10-13. Source: a read-only review of the version pins in the repo, and the pnpm release notes.

## Scope

Pin the Node version and the pnpm version in one place each. Then upgrade pnpm.

Do this after PR 1 of the [frontend fix plan](frontend-fix-plan.md) merges (`frontend-tooling-fixes`). That branch changes `frontend/Dockerfile` and adds jobs to `.github/workflows/test-frontend.yml`. The file contents below are from that branch.

This plan does not upgrade Node. See "Node upgrade" at the end.

Effort: S is less than half a day. M is one or two days. L is more.

## Current state

| Tool | File | Value |
|---|---|---|
| pnpm | `frontend/package.json`, field `packageManager` | `pnpm@11.3.0` |
| pnpm | `PNPM_VERSION` in `test-frontend.yml`, `build-ui-docker.yml` and `test-frontend-queries.yml` | `11.3.0` |
| Node | `.nvmrc` in the repo root | `v24` |
| Node | `NODE_VERSION` in the same three workflows | `24` |
| Node | `frontend/Dockerfile`, line `FROM` | `node:24-slim` |
| corepack | `frontend/Dockerfile` | `corepack@latest`, not pinned |

- The Docker build already gets pnpm from `packageManager`. `corepack enable` runs the pinned pnpm. CI gets pnpm from `PNPM_VERSION`. Nothing checks that the two agree.
- Dev machines already follow `packageManager`. pnpm 10 and later switch to the pinned version. Checked on 2026-10-13: a global pnpm 12.11.2 runs as 11.3.0 inside `frontend/`.
- `pnpm/action-setup@v6` can read `packageManager` with the input `package_json_file`. `actions/setup-node@v6` can read `.nvmrc` with the input `node-version-file`.
- pnpm 11.3.0 is old. The newest releases are 11.28.5 (2026-10-06) and 12.12.1 (2026-10-11). pnpm 11 still gets fixes. 11.28.4 fixes two ways that credentials could leak.
- `@types/node` is `^26.6.4` in all four `package.json` files, but the runtime is Node 24. TypeScript then accepts Node 26 APIs that do not exist in Node 24. `@tsconfig/node24` is correct.
- `.github/dependabot.yml` has `@tsconfig/node20` in the `typescript` group. The package is now `@tsconfig/node24`, so the pattern matches nothing.

## Decision

- **pnpm.** The single place is `packageManager` in `frontend/package.json`. pnpm, corepack and `pnpm/action-setup` all read it.
- **Node.** The single place is `.nvmrc` in the repo root. nvm, fnm and `actions/setup-node` read it.
- **One exception.** The `FROM` line in `frontend/Dockerfile` keeps its own Node version. Docker cannot read a file in `FROM`. The Docker build context is `frontend/`, so it does not see `.nvmrc`. A `--build-arg` would need a change in the release templates, which are in the Azure DevOps repo `tilavarauspalvelu-pipelines`. A CI check keeps the two equal.
- **Precision.** Pin the Node major only, as today (`v24` and `node:24-slim`). An exact pin needs a PR for each Node patch release, and no tool makes those PRs here. pnpm stays an exact version, because corepack accepts only an exact version.
- **Rejected: `devEngines.runtime`.** pnpm 12 can download and run the Node version that `package.json` sets. Then both pins would be in one file. But it puts shims in front of `node` on dev machines, and CI and Docker still need a Node to start pnpm. Few maintainers know this feature.
- **Rejected: `engines.node` with `engineStrict`.** It is a second copy of the Node version.

## Order

1. PR A. Pin Node and pnpm in one place each. No version change.
2. PR B. Upgrade pnpm to the newest 11 release.
3. PR C. Upgrade pnpm to 12.

PR B is a separate PR because it has low risk and it brings the credential leak fixes. PR C has breaking changes. If PR C has problems, PR B is still a good place to stop.

## PR A. Pin in one place (S)

- [ ] **Workflows.** Do this in `test-frontend.yml`, `build-ui-docker.yml` and `test-frontend-queries.yml`. There are 9 jobs with these steps.
  - Remove `NODE_VERSION` and `PNPM_VERSION` from the `env` blocks.
  - In each `pnpm/action-setup` step, replace `version:` with `package_json_file: frontend/package.json`. The path is relative to the repo root.
  - In each `actions/setup-node` step, replace `node-version:` with `node-version-file: .nvmrc`.
  - Keep the step order. `pnpm/action-setup` must run before `actions/setup-node`, because `cache: "pnpm"` needs pnpm.
- [ ] **CI check for the Docker image.** Add a step to the lint job in `test-frontend.yml`. It fails when the major version in `FROM` is not the major version in `.nvmrc`. For example:

  ```sh
  nvmrc=$(sed 's/^v//; s/\..*//' .nvmrc)
  docker=$(sed -n 's/^FROM .*node:\([0-9]*\).*/\1/p' frontend/Dockerfile)
  test "$nvmrc" = "$docker" || { echo "Node in .nvmrc ($nvmrc) is not the Node in frontend/Dockerfile ($docker)"; exit 1; }
  ```

- [ ] **Pin corepack in the Dockerfile.** `npm install -g corepack@latest` installs a new version at each build, outside the lockfile and `minimumReleaseAge`. PR 1 fixed the same problem for lint-staged. Pin an exact version, for example `corepack@0.36.0`, which Node 24.21 bundles. Do not remove the install. Node 25 and later do not bundle corepack, so the Node upgrade needs this line. `@sentry/cli` on the same line is also not pinned. The Sentry branch also changes this file, so pin it there or here after that branch merges.
- [ ] **`@types/node`.** Set it to `^24` in the four `package.json` files, so the types match the runtime. Fix the type errors that `pnpm lint` finds, if any.
- [ ] **Dependabot.**
  - Add an ignore for major updates of `@types/node`, like the React ignores. Comment: "Update with the Node version in `.nvmrc`."
  - Change the stale pattern `@tsconfig/node20` to `@tsconfig/node*`.
  - Check if Dependabot opens PRs for the `packageManager` field. Write the answer in the README section on dependency updates.
- [ ] **README, "Setup frontend".**
  - Step 2. Say that any pnpm 10 or later works, because pnpm switches to the version in `packageManager`.
  - Add one line: Node is set in `.nvmrc` and pnpm in `packageManager` in `frontend/package.json`. To change Node, also change `FROM` in `frontend/Dockerfile`. The CI check finds a mismatch.
- [ ] **`MIGRATION.md` lines 28-31.** They say `corepack prepare pnpm@latest --activate`. This activates the newest pnpm, not the pinned one. Remove these lines. The file is an old migration note in Finnish. Remove the file if nobody uses it.
- [ ] **Release pipelines.** Check that the templates in `tilavarauspalvelu-pipelines` do not install their own Node or pnpm. They should only run `docker build`. Then the Dockerfile is the only thing they need.

## PR B. Upgrade pnpm to 11.28.5 (S)

- [ ] Set `packageManager` to `pnpm@11.28.5`. After PR A, this is the only line to change. Choose a release that is at least 7 days old, to match `minimumReleaseAge`. 11.28.5 is from 2026-10-06.
- [ ] Run `pnpm install`. Commit the lockfile changes, if any. The lockfile format stays `9.0`.
- [ ] Check:
  - CI passes. Check in the job logs that `pnpm/action-setup` installed 11.28.5.
  - Build the customer and staff images locally. Check in the build log that corepack ran 11.28.5.
  - The husky hooks run after a branch checkout and a commit.

## PR C. Upgrade pnpm to 12 (S to M)

Choose the newest 12 release that is at least 7 days old. On 2026-10-13 that is 12.10.1 (2026-10-06). Do not choose a release before 12.10.0. pnpm 11 releases before 11.28.4 cannot switch to pnpm 12.9.x. This affects developers who have an old global pnpm.

These changes from the 12.0.0 release notes affect this repo:

- [ ] **Unknown keys in `pnpm-workspace.yaml` stop all commands.** pnpm 11 ignored them. pnpm 12 fails with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` when the pin matches the running pnpm. Run `pnpm install` with pnpm 12 and fix all warnings. The current keys are `packages`, `publicHoistPattern`, `overrides`, `minimumReleaseAge`, `minimumReleaseAgeExclude`, `peerDependencyRules` and `allowBuilds`.
- [ ] **Lockfile re-key.** pnpm 12 breaks dependency cycles in a new, fixed order. The first install that resolves again changes the keys of some peer variants once. A frozen install accepts the old lockfile. Check if a plain `pnpm install` changes the lockfile. If it does not, the change comes with the next dependency update. Then tell the reviewer of that PR to expect a large lockfile diff.
- [ ] **pnpm 12 is a native binary.** The `pnpm` npm package downloads the binary on first run. Check that it works in three places: corepack in the Docker build, `pnpm/action-setup` in CI, and the version switch on a dev machine. The Docker build has network access, because `pnpm fetch` needs it.
- [ ] **`pnpm install --frozen-lockfile false` is removed.** This repo does not use it. Check the release templates too.
- [ ] Run the same checks as in PR B.

No action is needed for the other breaking changes. This repo has no git dependencies, no `engineStrict` and no pnpmfile.

## Node upgrade (later, not in this plan)

- Node 24 support ends at the end of April 2028. The current contract ends at the end of 2028. So upgrade Node during this contract.
- Node 26 becomes LTS in October 2026. Upgrade after it does.
- After PR A, the upgrade changes `.nvmrc`, `FROM` in `frontend/Dockerfile` and `@types/node`.
- Node 25 and later do not bundle corepack. The pinned corepack install from PR A covers this.
