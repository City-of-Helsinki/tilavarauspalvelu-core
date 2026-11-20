# Release process: current state and improvement plan (draft)

Status: draft for refinement. No Jira cards and no code yet.

Sources:

- Confluence: [Uuden version julkaiseminen (TVP)](https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/8523218945/Uuden+version+julkaiseminen+TVP), version 31, mostly from 2024.
- Confluence release logs: [Julkaisujono (TVP)](https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/11075190861/Julkaisujono+TVP) (planned) and [Sprint 124 Tuotantoonviedyt (TVP)](https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/11083415556/Sprint+124+Tuotantoonviedyt+TVP) (released).
- Azure DevOps repo `tilavarauspalvelu-pipelines` (local copy, last commit `38e857d`).
- GitHub workflows and the `azure-pipelines-*.yml` triggers in `tilavarauspalvelu-core`.
- Jira epic [TILA-4513](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4513) and its child issues.
- Answers from the team (Joonatan, 17.11.2026). See section 5.

## 1. Current process

### 1.1 Build and deploy chain

| Env | Trigger | Image | Deploy |
|---|---|---|---|
| dev | Merge to `main` | GitHub Actions builds the base image. Azure `*-build-dev` waits for it (max 5 min) and pushes to Quay with the short commit hash. | Azure `*-deploy-dev`, automatic after the build |
| test | Git tag `v*` | Same flow. Azure `*-build-release` tags the image with the git tag. | Azure `*-deploy-test`, automatic after the build |
| staging | Manual | Reuses the release image | Azure `*-deploy-staging`, run by hand, one per app |
| production | Manual | Reuses the release image | Azure `*-deploy-production`, run by hand, one per app, with approval |

Details that matter for the plan:

- Three apps: `core` (with celery worker and scheduler), `customer-ui`, `staff-ui`. Each app has its own build and deploy pipelines.
- The tag suffix selects the apps: `-core`, `-ui`, `-customer`, `-staff`. No suffix builds all three.
- The release triggers have path filters (for example `backend/**`). A tag with no change in an app still gets an image:
  the GitHub build is cached and only retags it. So each app gets the new tag to deploy. (Team view. Verify once.)
- A deploy with reference `latest` uses the tag stored in the Azure `common` variable group. The build pipeline writes it.
- The approval gate is an Azure DevOps "environment" check. The deploy job in `job-templates/rollout-dc.yml` names the environment.
  Checks are set in the Azure UI, not in the repo. The dev team approves and can change the checks.
- Core deploy (`stage-templates/image-deploy.yml`) has two stages: `Deploy` and `auditlogging`. Azure asks for approval once per stage.
  So a core production deploy needs two approvals.
- Core uses the Recreate strategy. Migrations run in the mid hook. The backend is down for a few minutes.
  Worker and scheduler roll out after core, one after the other. A full core deploy takes about 10 min (TILA-4699).
- A production deploy posts to the Platta channel `#platta-app-deployments` (Platta template `slack-notify-prod-deploy-start.yml`).
  Platta uses it to ignore health check alerts during the window.
- Staging has no checks and is not used for release testing. Staging is only for internal training.

### 1.2 Release steps today (one release)

| # | Step | Who | Where | Manual actions |
|---|---|---|---|---|
| 1 | Make the tag and the GitHub pre-release. A GitHub bot posts the release to the Slack release thread. | Dev | GitHub | 1 |
| | Build and deploy to test | automatic | Azure | 0 |
| 2 | Wait for the test deploy. Run the e2e suite ("robot") against test. Post the run link to the Slack release thread. Add ✅ when it passes. | Dev | GitHub `run-e2e.yml` (`workflow_dispatch`), Slack | 3 |
| 3 | Decide what needs manual testing | Dev, now with an agent | local, for example `release-test-v1.75.md` | 1 |
| 4 | Manual testing on test | Dev or PO | test env | many |
| 5 | Approval from the product owner | PO | chat or meeting | 1 |
| 6 | Deploy to staging | Dev | Azure, 3 pipelines | 3 |
| 7 | Deploy to production | Dev | Azure, 3 pipelines | 3 runs + 4 approvals |
| 8 | Check that the right versions run | Dev | `just infra release-check production --version vX.Y.Z` | 1 |
| 9 | Remove the pre-release flag | Dev | GitHub | 1 |
| 10 | Update the Confluence release logs (planned and released) | Dev | Confluence | 1 to 2 |

Total for a full release: about 20 manual actions plus the testing. Releases happen about twice a week
(8 tags from 5.11. to 17.11.2026, many of them patches).

Why step 2 is manual: the e2e run must wait for the Azure test deploy. GitHub does not know when Azure is done,
so nobody can start the run from the tag directly.

Why step 5 exists: a core release takes the backend down for a few minutes. The PO informs the users and the helpdesk.
Major changes are a second reason, but they are rare.

### 1.3 Confluence page is out of date

- It says staging needs an approval. The staging check is off.
- It does not mention the audit logging stage and its second approval.
- It does not mention e2e, the test plan, PO approval or `release-check`.

Update the page after the new process is agreed. Ask the user before editing it.

## 2. Pain points and direction

| # | Step | Pain | Direction |
|---|---|---|---|
| 1 | Tag | Manual, easy to pick the wrong version or suffix. | Gate A becomes a release script run by an agent (see 3.1). It picks the next version, makes the tag and the pre-release with generated notes. The tag still starts the Azure flow. Drop the suffixes (see 3.4). |
| 2 | e2e | Async with the Azure deploy. Someone must wait, start it, post the link and add ✅. | A separate "Release e2e" workflow on tag push runs `release-check test --version <tag> --wait`, then the e2e suite, then posts the result to Slack. Manual e2e runs stay separate and do not post. All in GitHub, no Azure change. See 3.1. |
| 3 | Test plan | Manual, but an agent already does most of it. | Part of the gate A script. The agent reads the PRs between the previous tag and this tag, writes the test plan and posts it to Slack. It flags migrations (downtime), GraphQL schema changes and risky areas. It also proposes if the release is "simple" (see 3.2). Start as a local skill. Later in CI (TILA-4687). |
| 4 | Manual testing | Done for every release. It is the only reason for gate B. | Skip it for simple releases where e2e passes. Keep it for the others. A good test plan from step 3 keeps it short. |
| 5 | PO approval | Wait time. Only needed because of downtime. | Remove from the normal flow. Keep only for releases with downtime or major changes. See 3.2. |
| 6 | Staging | 3 runs, no value for release checks. | Deploy in parallel with production in the single pipeline (TILA-4670). No approval. |
| 7 | Production | 3 runs, 4 approvals. | One pipeline, one stage (TILA-4670, TILA-4681). Gate B (one start or approval by the dev team) only for releases with manual testing. |
| 8 | Check | Now `just infra release-check`. Manual. | Run it as the last step of the release pipeline (TILA-4669). Post the result to Slack. |
| 9 | Pre-release flag | Easy to forget. | A GitHub workflow removes it with `GITHUB_TOKEN` when `release-check production` sees the version. No token for Azure needed (see 3.6). |
| 10 | Confluence logs | Left over from an older process that needed more release planning. | Stop. Use the GitHub release notes as the record. Optionally a Jira fix version. |

## 3. Target shape (proposal)

### 3.1 Two gates

```
Gate A: release script (dev starts it, an agent does the work)
  -> pick the next version, tag vX.Y.Z, pre-release with notes   (script)
  -> build + deploy test             (Azure, exists)
  -> test plan, flags, simple or not (script, parallel with the deploy) -> Slack
  -> release-check --wait on test    (GitHub, new)
  -> "Release e2e": e2e on test + Slack post  (GitHub, new workflow, reuses run-e2e.yml)

Simple release (e2e passes, no flags, see 3.2):
  -> no manual testing, no gate B. Production deploy starts.
Other releases:
  -> manual testing                  (people, from the test plan)
  -> [only with downtime] PO agrees the time and informs users and helpdesk
  Gate B: a dev starts or approves the production pipeline

All releases:
  -> Platta Slack notice             (exists)
  -> core, then the UIs              (production and staging in parallel)
  -> release-check + Slack message   (same pipeline)
```

Gate A is a script that a developer starts. For example a skill, or a `just` recipe that calls the agent.
The script does these steps:

1. Find the previous tag and pick the next version. The developer confirms the version.
2. Make the tag and the GitHub pre-release with generated notes. The tag starts the Azure build and the test deploy, as today.
3. Read the PRs between the two tags. Write the test plan. Flag migrations, GraphQL schema changes and risky areas.
   The migration and schema flags compare against the version in production, not the previous tag (see 3.2).
4. Propose "simple" or "not simple" (see 3.2).
5. Post the test plan and the proposal to the Slack release thread. If Slack fails, save the plan as a file and print the path.

Step 3 needs only git and GitHub. It runs while Azure deploys to test.
The first version runs locally with the developer's own `gh` and Slack login. So it needs no new tokens.
Later it can run in CI (TILA-4687). Then it needs the tokens in 3.6.

Gate B exists only because of manual testing. Without manual testing, nobody needs to stop between test and production.
For a simple release the production deploy can start when e2e passes.

Start with gate B for all releases. Use the "simple" result only as advice at first.
When the advice has been right for some releases, let simple releases skip gate B.
How the deploy then starts is in 3.6 (Azure access from GitHub).

#### Release e2e workflow

Today `run-e2e.yml` ("E2E tests") has only `workflow_dispatch`. People also run it for other reasons, for example after changes in the tests.
A Slack post or a "simple" check must see only the runs for a release. So the release runs get their own workflow:

- New file `release-e2e.yml`, name "Release e2e". Trigger: `push: tags: ['v*']`.
- Job 1 runs `release-check test --version <tag> --wait`. On timeout it fails with "timed out", not "e2e failed".
- Job 2 calls `run-e2e.yml`. Add `workflow_call` to `run-e2e.yml` next to `workflow_dispatch`, with the same inputs.
  The release run uses fixed values, for example "All Tests" and parallel.
- Slack: at first the GitHub app for Slack posts the run, so no job is needed. Later, with a custom bot,
  a Job 3 posts the result with the run link to the release thread (see 3.5).
- Manual "E2E tests" runs do not change and do not post. "E2E checks" (`test-e2e.yml`) is a different workflow and is not affected.
- Azure and the "simple" check read the result of the "Release e2e" run for the tag, not of any e2e run.

The tag must come from a person or a GitHub App. A tag pushed with `GITHUB_TOKEN` does not start this workflow (3.6).

Rejected: add the tag trigger to `run-e2e.yml` itself and filter on the event. The inputs are empty on push,
so every input needs a fallback, and the wait for the deploy goes into the same file.

### 3.2 PO involvement

PO approval is not part of the normal flow. The PO is needed when users notice the release:

| Case | How to detect | PO |
|---|---|---|
| No downtime | No new migrations. After TILA-4662 the core update rolls. UI-only releases already roll. | Not involved. Release notes are enough. |
| Downtime | New migration files since the version in production (see "Flagging migrations and schema changes" below) | Agrees the time. Informs the users and the helpdesk. |
| Major change | Judgment. The agent can flag large user-facing changes. | Informed before the release. |

Today every core release has downtime. So until TILA-4662 lands, this saves little.
TILA-4662 is what makes this step go away for most releases.

The PO should have access to the Azure approval (to be tested). That is a fallback, not the normal path.

A release is "simple" only when all of these are true. The agent proposes it. A developer can always mark a release "not simple".

- e2e passes on test.
- No downtime. Until TILA-4662 lands, this means UI-only releases.
- No GraphQL schema change that removes or changes a field.
- No change in payments, access codes, personal data or the double booking guards.
- The test plan has no item that e2e does not cover.

#### Flagging migrations and schema changes

Flag on both sides. Each side has a different job.

- **GitHub tells people.** The flags go to the test plan, the PO and the "simple" proposal.
- **Azure decides the deploy.** TILA-4662 runs `manage.py migrate --check` with the new image before the deploy.
  With migrations it takes the Recreate path. Without migrations it takes the Rolling path.

Azure must not read a GitHub flag to pick the path. `migrate --check` looks at the database that gets the deploy.
A GitHub flag looks at a range of tags. Production often skips versions. Example: test gets v1.75 and v1.76,
and production goes from v1.74 to v1.76. The v1.75 migrations are not in the v1.76 diff.
A flag from the tag diff would then start a rolling update with migrations that are not applied. A label changed by hand has the same risk.

Both changes are easy to find from the files:

| Change | Files |
|---|---|
| Migrations | New files under `backend/**/migrations/*.py` |
| GraphQL schema | `tilavaraus.graphql` in the repo root. It is committed. `manage.py update_graphql_schema` writes it. |

GitHub side:

1. **PR labels.** Add `migrations` and `graphql-schema` rules to `.github/labeler.yml`. Config only. The `pr-labeler.yml` workflow exists.
2. **Release body.** The gate A script writes one line for each flag, for example "Migrations: yes (downtime)".
   Do not add a category for these in `.github/release.yml`. GitHub puts a PR in only the first category that matches,
   so these PRs would leave Features and Fixes.
3. **Compare against production.** Gate A gets the running version with `release-check production` and diffs from that version.
   Then the downtime and "simple" flags stay correct when releases are skipped.

Azure side:

- Keep the check as TILA-4662 describes.
- Add: log the path that ran (Recreate or Rolling) in the deploy output or in the Platta Slack post.
  Then the team can compare it with the GitHub flag.

A change in `tilavaraus.graphql` does not say if the change breaks a client. An added field is safe.
A removed or changed field breaks an old UI against the new core. "Core first" (3.4) does not fix this.
The gate A agent reads the schema diff and flags breaking changes. Do not block the release on it automatically.

### 3.3 Migrations against a production copy

Staging does not give a useful check. A better check for releases with migrations:
run the migrations against a copy of the production database before gate B.
This catches slow or failing migrations on real data volumes.

This depends on [TILA-4620](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4620) (anonymised production copy),
which is blocked by [TILA-4619](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4619) (GDPR anonymisation gaps).
Keep it as a later step. It is not needed for the first version of the pipeline.

### 3.4 App selection and order

Tag suffixes do not fit well with one pipeline and rolling updates. Proposal:

- Drop the suffixes. Each tag builds all three apps. Unchanged apps get a cached retag, so this is cheap.
- The combined pipeline has one boolean toggle per app (`deployCore`, `deployCustomerUi`, `deployStaffUi`), all on by default.
  Turn one off for a hotfix that must not touch the others.
- Keep the per-app pipelines for single hotfixes (as TILA-4670 says).

Order: core first, then both UIs in parallel. A GraphQL schema change breaks the UIs against an old API.
Without schema changes the apps could deploy independently, but "core first" costs little and needs no check.
The only reasons to deploy a UI first are maintenance mode (TILA-4682) or a UI-only release. The toggles cover both.

### 3.5 Slack

- Releases are already posted by the GitHub app for Slack to the Slack release thread.
- New: the gate A script posts the test plan to the release thread.
- New: the e2e workflow posts its result (pass or fail with the run link) to Slack. This replaces the manual link and ✅.
- The release pipeline posts the smoke check result (TILA-4669). The Platta notice stays as it is.

A post in a thread needs the `ts` of the parent message. The GitHub app makes the parent, so our code does not know its `ts`.
Two ways to get it:

- Read the channel history and find the GitHub app post for the tag. This needs a bot token with history scope.
- Our own code posts the parent (for example the gate A script), and keeps the `ts`. Later posts use it.
  For CI, store the `ts` somewhere the workflows can read. For example a line in the GitHub release body.

A new message in the channel is simpler, but the release thread keeps one release in one place. Decide in section 5.

#### Posting in stages

1. Now, no new Slack app: subscribe the existing GitHub app for Slack to the "Release e2e" workflow only.
   For example `/github subscribe City-of-Helsinki/tilavarauspalvelu-core workflows:{name:"Release e2e"}`.
   Do not subscribe to `workflows` without a filter. That posts every run of every workflow.
   Check the filter syntax in the app docs (`github.com/integrations/slack`) first. Not tested yet.
   Limits: it posts in the channel, not in the release thread. It shows the status and the run link, not free text.
2. Gate A script locally: the developer's own Slack login posts the test plan (3.6).
3. Later, if we get a custom bot: a new Job 3 in "Release e2e" posts to the release thread with a bot token, and the GitHub app subscription goes away.
   See the Slack notes in 3.6 for what the bot needs.

### 3.6 Tokens and identities

Personal tokens are fine for the local script. CI should use tokens that do not belong to a person.
A personal token stops when the person leaves. This matters with consultancy contracts.

| Need | Option | Personal? | Notes |
|---|---|---|---|
| Slack, new message in a channel | Incoming webhook of a Slack app | No | Bound to one channel. Simplest. |
| Slack, reply in a thread | Incoming webhook with `thread_ts` | No | Slack docs say it works. The webhook does not return the `ts`, so it cannot start a thread for later posts. |
| Slack, reply in a thread | Bot token (`xoxb`) with `chat:write` | No | `chat.postMessage` returns the `ts`. Add `channels:history` (or `groups:history` for a private channel) to find the GitHub app post. The bot must be in the channel. |
| Slack, local script | The developer's own Slack (MCP or user token) | Yes | Fine locally. The post shows the developer's name. Not for CI. |
| GitHub, from GitHub Actions | `GITHUB_TOKEN` with `contents: write` | No | Made for each run. No approval. Can make tags and releases and change the pre-release flag. |
| GitHub, from Azure or other CI | Fine-grained PAT | Yes | Can need org approval. This is the pending PAT approval. |
| GitHub, from Azure or other CI | Classic PAT | Yes | Wide scopes. Orgs often block them. |
| GitHub, from Azure or other CI | GitHub App | No | The app private key makes installation tokens that last 1 hour. An org owner installs the app. The Azure `GitHubRelease` task documents only OAuth and PAT connections, so use the REST API from a script step. |
| GitHub, from Azure or other CI | Machine user with a PAT | No person, but a user account | Needs a seat and someone who owns the login. A GitHub App is cleaner. |
| Azure, from GitHub (auto deploy of simple releases) | Entra ID service principal with GitHub OIDC (workload identity federation) | No | No stored secret. Needs a City Entra admin and access in Azure DevOps. An Azure DevOps PAT also works, but it is personal. Not needed if Azure polls GitHub (see below). |

Notes:

- Slack bot tokens and webhooks need a Slack app in the workspace. If the workspace limits apps, an admin must approve it.
  See "Slack tokens for a custom bot" below.
- A tag or a release made with `GITHUB_TOKEN` does not start other GitHub workflows. If the tag is made in CI later,
  start the e2e workflow from that same workflow, or use a GitHub App token. Azure triggers are not affected.
- The pre-release flag needs no Azure token. A GitHub workflow can run `release-check production --version <tag>`
  (on a schedule or by hand) and remove the flag with `GITHUB_TOKEN`. This removes the PAT dependency for step 9.

#### Slack tokens for a custom bot

Tested 20.11.2026 (Joonatan). In the City of Helsinki workspace a developer can create a Slack app, but cannot install it.
Slack says: "You don't have permission to install apps in City of Helsinki. You can still create your app, but an admin or owner will need to install it."

Only an installed app gets a token that can post. The token prefix shows the type:

| Prefix | Where it comes from | Can post or read messages? |
|---|---|---|
| `xoxb` | Bot token. Given when the app is installed. | Yes, as the app. Not personal. This is what CI needs. |
| `xoxp` | User token. Given when the app is installed with user scopes. | Yes, as the person. Personal. |
| `xapp` | App-level token (Basic Information). No install needed. | No. Only for Socket Mode. |
| `xoxe.xoxp` (access) and `xoxe` (refresh) | App configuration token (top of `api.slack.com/apps`). No install needed. | No. Only the `apps.manifest.*` methods (edit the app config). The access token expires in 12 hours. |

The token made on 20.11. is a configuration token. It cannot post. Incoming webhooks also need the install.

Steps to get a bot that posts in the release thread:

1. Create the app at `api.slack.com/apps` in the City of Helsinki workspace. Use a team name, not a person's name.
2. Bot token scopes: `chat:write`, and `channels:history` (or `groups:history` for a private channel) to find the GitHub app post for the tag (3.5).
3. Click "Request to Install". The reason: post e2e results and the test plan to the release thread, without a personal account.
4. When an admin installs it, copy the `xoxb` token to a GitHub Actions secret. Never commit it or put it in a log.
5. Invite the bot to the release channel (`/invite @<app>`).
6. Add a second owner (collaborator) to the app, so it does not depend on one person when the contract changes.

Still unknown: who are the workspace admins, and how long an approval takes (open question 2).

#### Sync between GitHub and Azure: polling, no tokens

GitHub and Azure run two async pipelines. Do not let one call the other. Let each side poll the other with read access only.
It is not elegant, but it needs no tokens, no PAT approval and no person's account.

- **GitHub waits for Azure.** A GitHub job runs `scripts/release-check.sh <env> --version <tag> --wait`.
  The version endpoints are public, so it needs no secret. This is the sync for the e2e run (test) and for the pre-release flag (production).
- **Azure waits for GitHub.** Only needed if simple releases skip gate B. `tilavarauspalvelu-core` is a public repo,
  so Azure can read the e2e run result and the "simple" flag from the GitHub API without a new token.
  Two ways: a script step in the release pipeline that polls, or the built-in "Invoke REST API" check on the production environment.
  The check retries on an interval until it passes or times out. Unauthenticated GitHub API calls have a low rate limit (60 per hour per IP),
  so poll every few minutes, not every few seconds. The existing Azure GitHub service connection can raise the limit if needed.
- **Where to store "simple".** It must be a thing both sides can read. For example a line in the GitHub release body, or a label on the release.
  The gate A script writes it. A developer can change it by hand.

Timeouts (team numbers, 19.11.2026):

| Part | Time today | Notes |
|---|---|---|
| Build (GitHub, then Azure) | a few minutes | Azure waits up to 5 min for the GitHub image. |
| Core deploy to test | 7 to 10 min | Maybe 3 to 5 min after TILA-4699. |
| e2e suite | 8 to 10 min | Will grow. Can wait for a free runner. |

- Use two timeouts, not one. The `release-check --wait` step gets about 20 min (default is 900 s).
  The e2e job gets its own job timeout. The whole flow from tag to e2e result is then about 30 min.
- Runner queue time does not count in the job timeout. So a slow result can be a queue, not a hang.
- On timeout, post "timed out" to Slack, not "e2e failed". These need different actions.

#### Gate B for production

The production deploy starts hours after the tag, when a person decides. A GitHub job must not wait that long.
Azure cannot tell GitHub that a person approved, unless Azure gets a GitHub token. So pick where the person acts:

| Option | Person acts in | Tokens | Notes |
|---|---|---|---|
| A. Gate in Azure (today) | Azure approval UI | none | GitHub sees the deploy only by polling production. Use a schedule (for example every 30 min) that runs `release-check production` once, removes the pre-release flag and posts to Slack. |
| B. Gate in GitHub, Azure polls | GitHub. A `workflow_dispatch` job with a GitHub environment that has required reviewers. | none | The tag starts the Azure release run. Its production stage has an "Invoke REST API" check that polls the public GitHub API: is there a successful approve run for this tag? Checks are agentless, so a waiting run holds no agent. An exclusive lock (`runLatest`) cancels the older waiting runs. After the deploy, GitHub polls production with `release-check --wait`, because the job starts when the deploy starts. |
| C. GitHub starts Azure | GitHub, same as B | Azure DevOps identity in GitHub | The GitHub job calls the Azure "Run pipeline" REST API, then polls with `release-check --wait`. A PAT works, but it is personal and expires (max 1 year). An Entra service principal with GitHub OIDC is not personal and stores no secret. It needs a City Entra admin. |

Proposal: start with A. It works today with TILA-4670. Try B when simple releases skip gate B, because the same polling check covers both.
"Approve" for a simple release is then the e2e workflow, not a person. Keep C as the fallback if the Azure check cannot read GitHub. Verify these in a spike:

- The "Invoke REST API" check can call GitHub with no credentials (Generic connection with no auth), and the check timeout fits a release (hours to days).
- Who can run the approve job. Only the dev team, through the GitHub environment reviewers.

## 4. Related tickets in TILA-4513

| Ticket | Status | Role in this plan |
|---|---|---|
| [TILA-4705](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4705) Release check script | Testing | Step 8 today. Base for the smoke check and the e2e wait. |
| [TILA-4670](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4670) One pipeline for staging and prod | Unprioritised, Matti | Steps 6 and 7. Gate B. Update with: staging in parallel, per-app toggles, no suffixes. |
| [TILA-4681](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4681) Audit logging in the Deploy stage | Unprioritised | Removes the second core approval. Do it with or before TILA-4670. |
| [TILA-4669](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4669) Prod smoke check and Slack | Unprioritised | Step 8 in the pipeline. Can reuse `scripts/release-check.sh`. |
| [TILA-4699](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4699) Faster backend deploy | Review, Matti | Shorter and safer core rollout. Fixes the worker order bugs. |
| [TILA-4662](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4662) Rolling update without migrations | Unprioritised, Tuomas H. | Removes downtime for most releases, so PO approval drops out. Blocked by TILA-4699. |
| [TILA-4682](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4682) Maintenance mode during backend deploy | Unprioritised | For releases that still have downtime. Pipeline sets the flag during the core rollout. |
| [TILA-4620](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4620) Anonymised production DB copy | Unprioritised | Base for the migration check in 3.3. Blocked by TILA-4619. |
| [TILA-4687](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4687) CI AI agent runner and skills | Unprioritised | Runs the test plan agent (step 3) in CI. |
| [TILA-4630](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4630) Config from variable groups to the repo | Backlog | Not needed for this plan. Touches the same pipelines, so plan the order. |
| [TILA-4654](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4654) Review environments | Unprioritised | Out of scope. Could move e2e earlier, to the PR. |
| [TILA-4636](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4636) Canary releases | Unprioritised | Out of scope. Not needed for this scale. |

### 4.1 Split into a new epic (done 17.11.2026)

TILA-4513 had 54 child issues. 8 of them are about the release process. They are now in the new epic
[TILA-4721](https://helsinkisolutionoffice.atlassian.net/browse/TILA-4721) "Julkaisuprosessin automatisointi ja nopeutus"
(relates to TILA-4513). The blocker link changes and the new tickets below are not done yet.

| Ticket | Status | Group |
|---|---|---|
| TILA-4705 Release check script | Testing | Release pipeline |
| TILA-4670 One pipeline for staging and prod | Unprioritised | Release pipeline |
| TILA-4681 Audit logging in the Deploy stage | Unprioritised | Release pipeline |
| TILA-4669 Prod smoke check and Slack | Unprioritised | Release pipeline |
| TILA-4699 Faster backend deploy | Review | Downtime |
| TILA-4662 Rolling update without migrations | Unprioritised | Downtime |
| TILA-4682 Maintenance mode during backend deploy | Unprioritised | Downtime |
| TILA-4683 Network errors when Next.js goes away during deploy | Unprioritised | Downtime |

Stay in TILA-4513, with a "relates" link only where it helps:

- TILA-4696 (Done). Keep the history where it is.
- TILA-4704 Core HPA. Scaling, not releases.
- TILA-4620 production copy and TILA-4687 CI agent runner. Wider use than releases.
- TILA-4630, TILA-4636, TILA-4654. Out of scope.

Blockers in the moved set. Only the first one is a Jira link today:

| Ticket | Waits for | Link today | Proposal |
|---|---|---|---|
| TILA-4662 | TILA-4699 | blocked by | Keep |
| TILA-4669 | TILA-4705 (reuses the script) | none | Add "blocked by" |
| TILA-4670 | TILA-4681 (same stage, do first or together) | none | Add "relates", or "blocked by" if done first |
| TILA-4670 | TILA-4669 (last step of the pipeline) | relates | Keep. The pipeline can ship without it. |
| TILA-4682 | TILA-4646 retry (Development, epic TILA-4272) | relates | Change to "blocked by" |
| TILA-4683 | TILA-4646 in production and TILA-4682 | relates | Change to "blocked by" both |

New tickets for the epic, with their blockers:

| Candidate | Blocked by |
|---|---|
| "Release e2e" workflow: automatic e2e on test after a tag, with a Slack result (3.1) | TILA-4705 in production (version endpoints) |
| Gate A release script: tag, pre-release, test plan, simple flag, Slack post | none. Relates to TILA-4687. |
| PR labels for migrations and GraphQL schema changes (3.2) | none |
| Skip gate B for simple releases (auto deploy after e2e) | TILA-4670 and the e2e ticket. Azure polls GitHub, no token (3.6). |
| Process change: PO only for downtime, stop the Confluence logs | none (PO decision) |
| Remove the pre-release flag with a GitHub workflow | TILA-4705 in production |
| Migration check against a production copy | TILA-4620 (which is blocked by TILA-4619) |
| Update the Confluence release page | TILA-4670 |

Dry runs done 17.11.2026, nothing changed in Jira:

- `jira-create --type Epic` with a Finnish description and `--relates TILA-4513`: the type is valid, and the request is a plain issue create plus one link.
- `jira-update TILA-4670 --parent <epic>`: the request changes only the parent, from TILA-4513 to the new epic.

Missing tickets (candidates, not created):

- "Release e2e" workflow: automatic e2e run on the test env after a tag, with a Slack result (step 2, 3.1).
- Gate A release script: tag, pre-release, test plan, simple flag, Slack post (steps 1 and 3).
- PR labels for migrations and GraphQL schema changes in `.github/labeler.yml` (3.2). Config only.
- Skip gate B for simple releases (steps 4 and 7).
- Process change: PO only for downtime or major changes. Stop the Confluence release logs (steps 5 and 10).
- Remove the pre-release flag with a GitHub workflow (step 9). No Azure token needed.
- Migration check against a production copy (3.3). Later, after TILA-4620.
- Update the Confluence release page.

## 5. Decisions and open questions

Decided (17.11.2026):

1. The dev team approves gate B and manages the Azure checks. Platta gets the existing Slack notice.
2. PO approval is not in the normal flow. Only for downtime or major changes, so the PO can inform users and the helpdesk.
   The PO should have Azure access as a fallback (to be tested).
3. Staging runs in parallel with production. No checks on staging.
4. Core first, then the UIs. Independent order is possible without schema changes, but not needed.
5. Tag suffixes: drop them or make them automatic. Use per-app toggles in Azure for hotfixes.
6. Path filters are not a problem. Unchanged apps get a cached retag. (Verify once.)
7. Pre-release flag from Azure: maybe later. Waits for PAT approval (pending about a week). Find out who approves access tokens.
   Update 19.11.: a GitHub workflow can do it with `GITHUB_TOKEN`, so no Azure token is needed (3.6).
8. e2e result: now a manual link and ✅ in the Slack release thread. Automate it.
9. GitHub releases are enough. The Confluence release logs can stop, or move to Jira.

Decided (19.11.2026):

10. Gate A is an agent script. It makes the release (tag and pre-release, so Azure deploys to test) and writes the test plan. It posts the plan to Slack.
11. Gate B exists only for manual testing. Simple releases with a green e2e can skip it. Start with gate B for all, and the "simple" flag as advice.

Still open:

1. Who approves access tokens (PAT) in the City org? Who to ask to speed this up? Ask also about a GitHub App and an Entra service principal (3.6). They do not depend on a person.
2. Slack for e2e results and the test plan: same thread (bot token and thread `ts`) or a plain message in the channel (webhook)? Who approves a Slack app in the workspace?
   Update 20.11.: a developer cannot install apps, so a bot or a webhook needs an admin (3.6). Until then, the GitHub app subscription to "Release e2e" gives a channel post without a new app (3.5).
3. Does the PO want a heads-up for every production release (for example the Slack post), or only for downtime?
4. Jira fix versions instead of the Confluence log, or only GitHub release notes?
5. Where does a person approve production: Azure UI (A), GitHub with Azure polling (B), or GitHub starting Azure with an identity (C)? See "Gate B for production" in 3.6.

## 6. Suggested order (for refinement)

0. Move the release process to its own epic first (see 4.1). Done: TILA-4721 has the 8 tickets.
   Still to do: fix the blocker links, then create the new tickets under it.
1. Finish TILA-4705 (release check). Already in testing.
2. TILA-4681, then TILA-4670 with per-app toggles and staging in parallel. Add the smoke check from TILA-4669 as the last step.
   This removes most clicks: steps 6, 7, 8.
3. "Release e2e" workflow after a tag, with a Slack result (new). Small, GitHub only. Removes step 2.
   Slack first through the GitHub app subscription (3.5), a custom bot later if an admin installs one.
4. Process change: PO only for downtime, stop the Confluence logs. No code. Removes step 10, and step 5 for UI-only releases.
5. Gate A release script with the test plan, the flags and the Slack post (new). Runs locally first, so no new tokens.
6. TILA-4699, then TILA-4662. Core releases without migrations have no downtime, so step 5 goes away for most releases.
   Add to TILA-4662: log the path that ran (Recreate or Rolling). See 3.2.
7. Pre-release flag from a GitHub workflow with `GITHUB_TOKEN` (new). Small, no new token.
8. Skip gate B for simple releases, after the "simple" advice has been right for some releases.
9. Later: migration check on a production copy (after TILA-4620).
