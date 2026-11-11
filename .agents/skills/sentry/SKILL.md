---
name: sentry
description: >-
  Fetch a Sentry issue and its events, resolve issues, and drive a Seer autofix run up to the code changes,
  and list or delete releases, through the Sentry REST API. Use when the user references a Sentry issue
  with a URL or an issue ID, asks to resolve Sentry issues, asks to run or continue Seer or autofix on an issue,
  or asks to list or delete releases.
---

How to fetch a Sentry issue to find the cause of an error, how to take it through Seer,
and how to list and delete releases.

## 1. Authentication

If the directory `/run/secrets/sentry` exists, the scripts next to this file read the token from the file
`/run/secrets/sentry/token`. Use this in a container. Mount the token there as a secret.
If the file is missing, the scripts fail.
Nothing asks the user before the scripts read the file. In the container's Claude settings, add `Read(//run/secrets/**)`
to `permissions.deny`. The `skill-script-guard` hook blocks shell commands that name `/run/secrets/sentry`.

If the directory does not exist, the scripts read the token from 1Password with `op read`.
1Password asks the user to unlock. Wait for it.

The token is a personal token from https://city-of-helsinki.sentry.io/settings/account/api/auth-tokens/.
Set "Issue & Event" to Read & Write, "Organization" to Read, "Project" to Read and "Release" to Admin.
Only `sentry-autofix` and `sentry-resolve` need the write permission of "Issue & Event".
Only `sentry-releases delete` needs the admin permission of "Release".

The 1Password setup is as follows. If a call fails because of it, stop and tell the user which part is missing:

- `op` (1Password CLI) is installed.
- The 1Password desktop app has Settings → Developer → "Integrate with 1Password CLI" turned on.
- The 1Password vault has an "API Credential" item. `credential` is the token.
- The user's shell profile sets these variables:

| Variable                  | Meaning                                               |
|---------------------------|-------------------------------------------------------|
| `SENTRY_ISSUE_OP_ACCOUNT` | 1Password account, for example `vincit.1password.eu`. |
| `SENTRY_ISSUE_OP_VAULT`   | Vault that has the item, for example `Private`.       |
| `SENTRY_ISSUE_OP_ITEM`    | Name of the item, for example `Sentry API PAT`.       |

Never print the token, read the token file or call `op` for it yourself. Use only the scripts.

## 2. Run a script

Run the scripts from the repository root. The shell can be in another directory after an earlier command.
Give them the issue ID or the URL from the user as is. Put a URL or a free text argument in single quotes.
A free text argument cannot have a single quote inside.
A hook blocks the command if it is in any other form. Run each script as a single command, without pipes.

### Fetch an issue

```bash
.agents/skills/sentry/sentry-issue 153768154
.agents/skills/sentry/sentry-issue 'https://city-of-helsinki.sentry.io/issues/153768154/?project=4511422016192592'
```

The script fetches the issue and one event. The event is the one in the URL, or the latest event.

Stack frames are oldest first. Only in-app frames have code context.
Use the `release` and `environment` tags to find the code version the error came from.
Performance issues, such as N+1 queries, have no exceptions. Their `evidence` field has the repeated queries.

### Check all events with tag counts

One event can mislead. To see if a pattern holds for all events of the issue, add tag keys after the issue.
The keys are the same as in the event `tags`, for example `browser.name`, `os.name`, `url` or `release`:

```bash
.agents/skills/sentry/sentry-issue 153768154 browser.name os.name
```

The `tags` field then has the top values of each key over all events, with a count for each.

### Resolve issues

```bash
.agents/skills/sentry/sentry-resolve --dry-run TILAVARAUSPALVELU-STAFF-UI-12 153768154
.agents/skills/sentry/sentry-resolve --in-next-release --dry-run TILAVARAUSPALVELU-STAFF-UI-12
```

Give one or more issues. Each can be an issue ID, a URL or a short ID such as `TILAVARAUSPALVELU-STAFF-UI-12`.
The script looks up all issues before it changes any, so a wrong argument changes nothing.
It skips an issue that is already resolved and prints a "Skipped" line for it.

- `--in-next-release` resolves the issue when the next release of the project comes in.
  Use it for a fix that is merged but not deployed. If the error comes back in a later release,
  Sentry marks the issue as a regression.
- Without it, the issue is resolved now. Use it for old issues that have stopped, such as test errors.

`sentry-resolve` writes to Sentry. Run it with `--dry-run` first.
Show the preview to the user. Run the same command without `--dry-run` only after the user approves it.

To resolve an issue from a pull request instead, put `Fixes <short ID>` in the pull request description.
The GitHub integration of Sentry then links the issue and resolves it when the release comes in.

### Run Seer autofix

`sentry-autofix` does the same as the buttons in the Seer panel of the web UI.
Use it even if the Sentry MCP server is connected. The MCP can start a run and read its result,
but it cannot accept a step, rethink a step or open a pull request.

```bash
.agents/skills/sentry/sentry-autofix state 158537513
.agents/skills/sentry/sentry-autofix wait 158537513
.agents/skills/sentry/sentry-autofix start 158537513
.agents/skills/sentry/sentry-autofix plan 158537513
.agents/skills/sentry/sentry-autofix code 158537513 'Also cover a user with no social auth row in the test'
.agents/skills/sentry/sentry-autofix rethink 158537513 root_cause 'The N+1 is in X, not in Y'
```

- `state` shows the run. `sections` has the steps in the run. Each step has its result in `artifacts`,
  such as the root cause or the plan. The code changes step has the diffs in `file_patches`.
  `last_message` is the last text from Seer in the step. Read it. It tells what Seer did not do,
  such as tests it could not run, and it can have an error that is not in the artifacts.
- `wait` polls until `status` is not `processing` and no pull request is still being created.
  It gives up after 9 minutes. Then run it again.
  Give the shell command a timeout of 10 minutes.
- `start` starts a new run that stops after the root cause. It refuses if the issue already has a run.
- `plan` accepts the root cause and makes a plan. This is "Yes, make a plan" in the web UI.
- `code` accepts the plan and writes the code changes.
- `plan` and `code` take an optional instruction. Use it for small changes, instead of a rethink.
- `rethink` redoes `root_cause` or `solution` with your reason. This removes the later steps.
- `pr` opens a pull request on GitHub with the code changes. Run it only when the user asks for a pull request.
  After it, run `wait`. The link is in `pull_requests`.

Seer runs cost money, so do not start or rethink without a reason.

### List and delete releases

```bash
.agents/skills/sentry/sentry-releases list '-merge'
.agents/skills/sentry/sentry-releases delete 'tilavarauspalvelu-staff-ui@2791-merge' 'tilavarauspalvelu-customer-ui@2791-merge'
```

- `list` shows the open and archived releases of all projects, newest first. With a text, it shows only the versions that contain the text.
  `count` is the number of releases. `last_event` and `new_issues` tell if events refer to a release.
- `delete` deletes the releases with the exact versions. Give many versions in one command.
  Put each version in single quotes, because a version has `@` in it.
- `delete` cannot be undone. Run `list` first. Show the user the count and some versions.
  Delete only after the user agrees.
- Sentry does not delete a release that issues, events or health data refer to. Such a release is in `failed`
  with the reason. The script then exits with 1, but it still deletes the other releases.
- A delete can time out with an empty `error`, but Sentry can still delete the release. Run `list` again to check.

## 3. Seer workflow

1. Run `state`. If there is no run, run `start`. Then run `wait`.
2. Judge the root cause against the code in this repository at the `release` of the issue.
   Use `sentry-issue` for the event data. Check each claim in the root cause in the code.
3. Tell the user what you found. Then run `rethink` with a precise reason, or run `plan`. Then run `wait`.
4. Judge the plan in the same way, against the docs in `.agents/docs/` for the code it changes.
   Then run `rethink` on `solution`, or run `code`. Then run `wait`.
5. Judge the code changes. Look for scratch files that Seer left in `file_patches`. See section 4.
   Then stop and give the user the result and the issue URL.
6. The user checks the changes. If the user asks for a pull request, run `pr` and then `wait`.
   If a pull request has `status` `error`, its `error` field has the reason. Tell the user.

If `status` is `error` or `awaiting_user_input`, stop and tell the user.
After two rethinks of the same step, stop and ask the user.

## 4. Known problems

### A scratch file makes the pull request fail

Seer can leave a scratch file in the code changes, such as `backend/_check_tmp.py`.
It shows in `file_patches` with `type` `M` and an empty `diff`, but the file is not in the repository.
Then `pr` fails with the error "File contents must be provided for modify or delete operations."
The "Retry PR" button in the web UI fails in the same way.

- Look for such a file before you run `pr`. Tell the user about it.
- Running `code` again with an instruction to leave out the file does not help.
  The file stays in `file_patches`, because the new code step adds to the old one.
- `rethink` on `solution` removes the code step and the file with it.
  Then run `code` with an instruction to write no scratch file in the repository, and run `pr` again.

### Seer changes the plan in a rethink

A `rethink` makes a new plan. Seer can change the approach even when the reason says to keep the plan.
Read the new plan before you run `code`. If it is worse, give `code` an instruction that names the approach.
Seer followed such an instruction over the plan in the first test.

### Seer cannot run the backend tests

The sandbox of Seer has no GDAL or PostGIS, so Django does not start there. Seer runs only `ruff`.
The code changes are not tested. Tell the user, and let CI on the pull request run the tests.
