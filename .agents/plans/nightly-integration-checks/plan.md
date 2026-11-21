# Nightly checks of external services and Celery

Status: planning. Nothing is built yet. No Jira cards yet.
Related plan: [Release process](../release-process/release-process-plan.md). The two plans share parts. See "Links to the release plan".
Checked against the code on 20.11.2026. The fixes are in the sections below. The items that are still open are in "Open questions".

## Problem

When a check on the test environment fails, we do not know the cause. It can be a release we deployed to test.
It can also be an external service that broke. Sometimes the external service was already broken and the failure was expected.

## Goal

Every night, before the team starts work, run checks for:

- each external service the backend calls
- each Celery task, mostly the periodic ones
- the user flows of the existing e2e suite, on test only

Then show which environment fails, which version it runs, and what the most likely cause is.
Checks on prod must be read only. Checks on test can make changes.

The same checks also run at release time (see "Links to the release plan").
Then a red release e2e run shows at once if the cause is the release or an external service.

## What exists today

- e2e suite in `e2e/`. It is Playwright and targets `varaamo.test.hel.ninja`. On test it needs the `WAF_BYPASS_SECRET` header.
  `run-e2e.yml` runs it only when started by hand (`workflow_dispatch`). No e2e workflow is scheduled.
  Each run deletes and creates the shared test data again, so two runs must not overlap today.
  The workflow has `concurrency: group: ${{ github.workflow }}`. This guard stops working when other workflows call it (see part 5).
- Version endpoints: `/healthcheck`, `/kasittely/healthcheck` and `/monitoring/readiness/`.
  `scripts/release-check.sh` (TILA-4705) and `e2e/lib/app-versions-reporter.ts` read them already.
- `/monitoring/system-status/` checks only the DB, the cache, Redis and Celery. It checks no external service.
  Its Celery check (`CeleryHealthCheck` in `backend/config/health_checks.py`) pings the workers and checks that each queue has a worker.
- External services: Verkkokauppa, Pindora, Hauki, TPREK, Tunnistamo/Keycloak, Helsinki profile, SMTP,
  the Elasticsearch audit log and Varnish. Most clients extend `BaseExternalServiceClient`
  (`backend/utils/external_service/base_external_service_client.py`).
  Its `generic()` tries each request 3 times (`stamina`). The client timeouts are 5 to 30 s.
  `MOCK_VERKKOKAUPPA_API_ENABLED` and `PINDORA_MOCK_ENABLED` replace two of the services with mocks.
- Celery: 18 periodic tasks in `backend/tilavarauspalvelu/tasks.py`. About 10 of them call an external service.
  `populate_celery_tasks` creates them disabled after each migrate. Each env enables them by hand in the admin.
  The schedule is in the DB (`django_celery_beat`, `VaraamoDatabaseScheduler`). The broker is `filesystem://`.
  Results go to `django-db`. `CELERY_RESULT_EXTENDED` is off, so a `TaskResult` row has no task name.
  Nothing tells us when a task stops running or fails again and again.
- Audit log: the source is `DjangoAuditLogSource`. An entry waits on the auditlog `LogEntry` with `additional_data.is_sent` false
  until the `submit_unsent_entries` command sends it to Elasticsearch.
- uWSGI runs one thread per process and has no request timeout (`harakiri`). A slow request holds a whole process.
- Sentry is on sentry.io SaaS. There are no cron monitors yet.

## Environments and versions

| Env | Version | External service instances |
|---|---|---|
| dev | `main`. Every merge deploys. | test instances |
| test | The latest `v*` tag | test instances |
| stage | Same as prod | test instances |
| prod | The released tag | prod instances |

Stage always runs the same version as prod. The only exception is a hotfix that must skip test.
That gap closes in a few hours. Stage is used only for internal training, so the checks do not disturb release testing.

Not verified yet: the "External service instances" column. Check it once in the Azure variable groups of dev, test and stage:
the mock flags, the Verkkokauppa namespace and the Tunnistamo client. Write the result here.
If an env uses a mock, the comparison below does not work for that service.

Dev, test and stage use the same external instances with three different versions. So they separate code from service:

- dev shows changes on `main` that are not released yet.
- test shows the release candidate.
- stage is the control. It has the code of prod and the external instances of test.
  Stage has its own DB and its own config. So a failure only on stage points to config or data, not code.

## Main design point

The secrets and the network access for the external services are inside the cluster.
A GitHub runner must not hold the Pindora or Verkkokauppa keys.
So the service checks run in the backend.

A Celery periodic task runs the probes every 10 minutes in each env. It stores the result with a time stamp.
One endpoint returns the stored result and its age. The endpoint makes no outbound request.
The nightly job and the release pipelines only call that endpoint and put the results together.

The probe task also proves that beat, the broker and a worker work. If the stored result is older than 20 minutes, Celery does not run.

Rejected: run the probes in the request. With the current clients, one request can take minutes
(3 tries, 5 to 30 s timeouts, one thread per uWSGI process). A cache fills only when a round ends.
So during an outage, every call starts a new round and holds a uWSGI process. Many calls can then use up the backend.

## Decision table

The table is for each check, not for the whole run.

| Dev | Test | Stage | Prod | Most likely cause |
|---|---|---|---|---|
| fail | pass | pass | any | A change on `main` that is not released. The job links `compare/<test version>...<dev version>`. |
| any | fail | pass | any | The release on test. The job links `compare/<prod version>...<test version>`. |
| pass | pass | fail | any | Stage config or stage data. Stage has its own DB and config. |
| fail | fail | fail | pass | The test instance of the external service is broken. Not urgent for us. |
| fail | fail | fail | fail | The external service itself, or a change on their side that affects both instances. |
| pass | pass | pass | fail | Prod config or the prod instance. Urgent. |
| other | | | | Mixed. Look by hand. |

Rules for the table:

- A probe that is skipped (no data in the DB) or mocked (mock flag on) is "unknown", not "pass". A row with "unknown" needs a look by hand.
- A check fails only after it fails in 2 rounds in a row (20 minutes). One flaky failure must not change the row.
- The probes and the Celery checks run in the backend. So their compare links use the backend version.
  With suffix tags, the apps of one env can run different versions. The e2e results use the version of each app.
- If stage and prod run different backend versions (hotfix case), the job shows a warning and the compare links use the stage version.

The direct probes mostly measure the external service. The Celery checks and the test e2e run find our own regressions.
The probes give the baseline that lets us trust that signal.

## Access and tokens

The endpoint is ours, so the backend decides what it accepts. It does not need a token from GitHub or Azure.
The managed token question in the release plan (section 5, question 1) is about calls to GitHub and Azure. It does not block this plan.

1. **From the first PR: a shared secret in the `Authorization` header.** The backend has this pattern already:
   `EXPORT_AUTHORIZATION_TOKEN` in `reservation_unit_export` (`backend/tilavarauspalvelu/api/rest/views.py`).
   Put one secret for each env in its Azure variable group, and the same values in GitHub secrets.
   Someone must rotate it by hand in the backend, GitHub and Azure. For one secret this is acceptable.
2. **Later, if wanted: GitHub OIDC.** The workflow gets a signed token from GitHub. The backend checks the signature and the repository claim.
   No stored secret. More code than option 1.
3. **A header that passes the geo block.** It works like the WAF bypass header on test.
   It lets the runner pass the geo block and similar checks. We have got such headers before, so far only for testing.

Rejected: a public endpoint for the PoC. It shows anyone which integration is down. Option 1 costs about the same work.

The endpoint returns only status, latency and error class for each check. No response body, no IDs, no config.
Design it so that a change from option 1 to option 2 changes only one header, not the response or the callers.

### Step 0: can a GitHub runner reach each env?

This is the biggest unknown. If prod blocks GitHub runners, the prod part of parts 3 and 6 cannot work.
Then the alert from the backend (part 7) is the only prod check until "Long term".

Before any PR: one manual workflow run that calls `release-check.sh` for dev, test, stage and prod.
Test needs the `WAF_BYPASS_SECRET` header. Check if dev, stage and prod need it too.

## Parts

### 1. Probe task and endpoint for the external services

A Celery periodic task (for example `run_integration_probes`) runs every 10 minutes.
It stores the result in the cache (Redis, shared by all pods) with a time stamp.
`populate_celery_tasks` creates it disabled, like the other periodic tasks. Enable it in each env.

A new endpoint, for example `/monitoring/integrations/`, returns the stored result and its age. It is read only and safe on prod.
Access follows "Access and tokens".

- The endpoint is never a liveness or readiness probe. An external outage must not take the backend out of service.
- Add its path to `SENTRY_TRACES_IGNORE_PATHS`.

Each probe:

- uses the URL and the headers of the client, but calls `request()` directly. `generic()` tries 3 times.
- has its own timeout of a few seconds and no retry. The whole round stays under 1 minute, well inside `CELERY_TASK_TIME_LIMIT`.
- does not log to Sentry. A failed probe is a result, not an error.
- returns only a status, the HTTP code, the latency and the error class. No response body, because a body can have personal data.
- has one of these statuses: pass, fail, skipped (no data in the DB) or mocked (the mock flag is on).

| Service | Probe |
|---|---|
| Verkkokauppa | The `get_merchant` request with a merchant UUID from the DB. Expect 200 with a body. Do not use `get_order` with a random UUID. A wrong base URL or gateway route also returns 404, so that probe passes when the config is wrong. If the order API needs its own probe, check that the 404 body has the Verkkokauppa error format. Mocked when `MOCK_VERKKOKAUPPA_API_ENABLED` is on. |
| Pindora | GET of a reservation unit that has the access code type, taken from the DB. Skip the Redis cache. Skipped when no such unit exists. A 404 means that the unit is not in the Pindora instance. That is a data problem, so report it apart from an outage. Mocked when `PINDORA_MOCK_ENABLED` is on. |
| Hauki | `get_resource` for the resource of a reservation unit, taken from the DB. Skipped when no such unit exists. |
| TPREK | `get_unit` for one unit, taken from the DB. Skipped when no unit has a TPREK ID. |
| Tunnistamo/Keycloak | Fetch the OIDC discovery document. |
| Helsinki profile | No anonymous read call exists. Check only that the endpoint answers, for example with 401. The test e2e login flow covers the full path. |
| SMTP | Connect, send EHLO and NOOP. Send no mail. |
| Audit log | Count the auditlog `LogEntry` rows with `additional_data.is_sent` false, older than N hours and newer than 7 days. Filter on `timestamp` first, so the query does not read the whole table. A growing count means that Elasticsearch is broken or that `submit_unsent_entries` does not run. This also guards the TILA-4681 change. |
| Varnish | Open question: a HEAD request to the image cache host, or no probe. Purge errors already go to Sentry through `SentryLogger`. |

The probes take their IDs from the DB, so no config per environment is needed.
Stage and dev can lack the data. Then the probe is skipped, not passed.

### 2. Celery checks

A section in the same endpoint. The probe task fills it in the same round.

- **Scheduler.** For each enabled `PeriodicTask`, compare `last_run_at` with its crontab. Flag a task that is overdue.
  Beat writes `last_run_at` when it sends a task, not when a worker runs it. So this finds a scheduler that stopped, not a worker.
- **Worker.** Reuse `CeleryHealthCheck` from `/monitoring/system-status/`. It pings the workers and checks that each queue has one.
  The age of the stored probe result also shows a worker that stopped.
- **Results.** Set `CELERY_RESULT_EXTENDED = True`. Without it, `TaskResult.task_name` and `periodic_task_name` are empty,
  so a result cannot be linked to its task. With it, report the last state and `date_done` of each periodic task.
  It also stores the task arguments. Today they are mostly primary keys. Check that `celery.backend_cleanup` runs, so the table does not grow.
- **Enabled tasks.** List the names of the enabled periodic tasks. The nightly job compares the lists of test and prod.
  A new periodic task starts disabled in each env. So after a release it does not run in prod until someone enables it. Today nothing tells us.

This also catches a worker or scheduler that does not come back after a deploy (see the worker order bugs in TILA-4699).

Optional symptom counts. These are cheap DB reads. Examples:

- reservations that need an access code but have none
- payment orders still pending after they expired
- unsent emails in the queue

Sentry Crons can replace or extend this section later. See the open questions.

### 3. Nightly workflow

A new GitHub workflow with a cron at about 03:00 to 04:00 Helsinki time.
GitHub cron uses UTC with no daylight saving time. For example `17 1 * * *` is 03:17 in winter and 04:17 in summer.
Scheduled runs can start late at busy times, so do not use a full hour.

1. Read the versions of dev, test, stage and prod with the existing endpoints.
2. Read the probe endpoint on dev, test, stage and prod, with the shared secret. Test also needs the WAF header.
3. Run the e2e suite on test through `run-e2e.yml` with `workflow_call` (the same entry point as Release e2e).
4. Write the job summary with the decision table and the compare links.
   Compare the enabled periodic tasks of test and prod.
5. For each failed check, send one Sentry event with `sentry-cli send-event` (see part 7).
   Use the fingerprint `nightly:<env>:<check>`. Add the tag `source:nightly`, tags for the versions, and the compare links.

In the same PR, subscribe the GitHub app for Slack to failures of this workflow (part 7). It needs no code.
A check that nobody sees has no value.

### 4. Integration flows in the test e2e suite

The suite covers most mutating integrations already:

- a paid reservation through the real test checkout (`e2e/TestSuites/PO/Common/checkout.ts`)
- access codes in the admin flow (`e2e/TestSuites/Tests_users_with_admin_desktop.spec.ts`)
- email checks through `/v1/robot_email_cache/`

Open: does test use the real Pindora or the mock (`PINDORA_MOCK_ENABLED`)? With the mock, the access code tests do not reach Pindora.
Add a flow only where a gap shows.

These flows also help the "simple" release rule in the release plan (3.2). The rule needs a test plan with no item that e2e does not cover.

### 5. Parallel e2e runs

Three workflows now run the e2e suite on test: manual "E2E tests", "Release e2e" and the nightly run.
Today each run deletes and creates the shared test data, so the runs must not overlap.

`run-e2e.yml` has `concurrency: group: ${{ github.workflow }}`. In a called workflow, `github.workflow` is the name of the caller.
So when Release e2e and the nightly run call `run-e2e.yml`, each caller gets its own group, and the runs can overlap.
This starts in PR 4, before this part is done.

GitHub `concurrency` allows one running and one pending run per group. A newer pending run replaces the older pending one.
So a shared group can cancel a release run or a nightly run without a clear sign. Do not use it to queue the runs.

Stopgap in PR 4: a fixed group name in `run-e2e.yml`, for example `e2e-test-env`. Then only one run is active.
A replaced run shows as cancelled, not as passed. The nightly job reports "cancelled" as broken. This is acceptable for a short time.

Goal: several runs work at the same time, so nobody waits.

- Change the e2e tests, not the workflows:
  - Use stable base data. Do not delete and create it for each run.
  - Book random slots in the future, so two runs do not pick the same slot.
  - Handle a conflict in the test. For example pick a new slot and try again.
- Skip and priority rules are fine while this work is in progress. For example, Release e2e goes first,
  and the nightly run waits or skips if a release run is active.
- A run that stops, hits a conflict or skips must show as broken, with the reason. It must never pass in silence or disappear.

This also makes Release e2e faster, because it does not wait for other runs.

### 6. Read-only checks on prod after deploy and every night

One piece of work with TILA-4669 (prod smoke check and Slack).

- Read the probe endpoint and the Celery section on prod after each deploy and every night.
- A Playwright project loads the front page, runs a search, and opens a reservation unit page
  that shows the first reservable time (Hauki data). It does not log in. A prod login needs real strong authentication.

This part needs step 0 to pass for prod.

### 7. Notifications

A developer can create a Slack app but cannot install it (tested 20.11.2026, see the release plan 3.6).
The Sentry bot and the GitHub bot work.

- GitHub Slack app: subscribe the channel to failures of the nightly workflow, with a workflow filter. Do this in PR 3.
  The release plan uses the same subscription for "Release e2e". One test of the filter syntax covers both.
- Sentry project: send the nightly events to a separate project, for example `tilavarauspalvelu-checks`.
  Do not send them with `environment=production` to `tilavarauspalvelu-core`. There they mix with real backend errors and trigger its alert rules.
- Sentry issues: one issue per broken check, from the fixed fingerprint. "First seen" shows when it started.
  A new event each night shows that it continues.
  In the separate project, turn on auto-resolve, for example after 2 days with no event.
  A check that breaks again then shows as a regression, and nobody must resolve it by hand.
- Sentry alert: an alert rule cannot filter on a fingerprint. Filter on the tag `source:nightly`. The rule sends to Slack.
  Create the rule disabled and turn it on after a check in the web UI.
  The DSN does not belong to a person, so it fits the token rules in the release plan.
- Prod outage alarm (open question): the probe task can also send a failed probe to Sentry from the backend, after 2 failed rounds.
  Then a prod outage shows within about 20 minutes, not the next morning.
  This needs no GitHub runner, no token and no geo block. One Sentry Cron monitor on the probe task tells when Celery itself stops.

## Links to the release plan

| Release plan | Link to this plan |
|---|---|
| 3.1 Release e2e workflow | Before the e2e run, read the probe endpoint on test and stage. Add the decision table to the result. A red run then shows if the tag or an external service is the cause. An external outage does not block a release or mark it "not simple". |
| 3.1 `workflow_call` in `run-e2e.yml` | The nightly run uses the same entry point. Both need the fixed concurrency group (part 5). |
| 3.2 "Simple" release rule | The integration flows in part 4 cover more of the test plan. |
| 3.5 Slack, GitHub app subscription | Same fallback for the nightly workflow. |
| 3.6 Tokens, polling with no tokens | Not needed for the probe endpoint. It uses a shared secret (see "Access and tokens"). |
| TILA-4705 Release check script | The nightly workflow needs the version endpoints on all four envs. Release e2e needs them only on test. |
| TILA-4669 Prod smoke check | Uses the probe endpoint and the Celery section (part 6). The probe endpoint PR blocks it. |
| TILA-4681 Audit logging in the Deploy stage | The audit log probe finds a sender that stopped. |
| TILA-4699 Faster backend deploy | The Celery section finds a worker or scheduler that did not come back. |

## PR stack

One ticket per PR.

0. No PR: step 0. One manual workflow run that checks if a GitHub runner reaches dev, test, stage and prod.
1. Probe task and endpoint for the external services, with tests. Shared secret header. Skipped and mocked states.
2. Celery section in the same endpoint: `CELERY_RESULT_EXTENDED`, overdue tasks, worker check, enabled tasks
3. Nightly workflow: versions and probes on dev, test, stage and prod, the decision table, Sentry events.
   Also the GitHub Slack subscription, which needs no code.
4. Schedule the test e2e run through `workflow_call`, with the fixed concurrency group in `run-e2e.yml`
5. Parallel e2e runs: stable data, random future slots, conflict handling, skip and priority rules
6. Read-only prod checks with TILA-4669
7. Sentry project, alert rule on the tag, auto-resolve. Optional: the prod outage alarm from the backend.
8. Later, if wanted: GitHub OIDC instead of the shared secret

## Long term

Get dedicated IPs or dedicated GitHub runners that pass the geo block and similar checks.
A header token (see "Access and tokens") can also do this.
This is 1 to 2 years away. Until then, check those cases by hand while the project is active.

## Open questions

- Step 0: can a GitHub runner reach dev, test, stage and prod? Which of them need the WAF header?
- Are the mocks off on dev, test and stage? Do these envs really share the external instances? (see "Environments and versions")
- Is the prod check also an outage alarm? If yes, the probe task sends failures to Sentry from the backend (part 7).
- Who reads the nightly result and acts on it? Who owns it after the contract ends at the end of 2028?
- Which Sentry project gets the events, and who can create one? Who owns the Sentry plan?
- Does Sentry Crons fit the quota? If yes, start with one monitor on the probe task. Then add prod and test monitors
  for the tasks that call external services (about 10 monitors).
- Is `CELERY_RESULT_EXTENDED` acceptable? It stores the task arguments in the DB.
- Varnish: a probe, or no probe?
- Which Slack channel gets the alerts?
- Can an admin install a Slack app for us? This is not needed if the Sentry and GitHub bots are enough.
