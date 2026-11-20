# Nightly checks of external services and Celery

Status: planning. Nothing is built yet. No Jira cards yet.
Related plan: [Release process](../release-process/release-process-plan.md). The two plans share parts. See "Links to the release plan".

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

- e2e suite in `e2e/`. It is Playwright and targets `varaamo.test.hel.ninja`.
  `run-e2e.yml` runs it only when started by hand (`workflow_dispatch`). No e2e workflow is scheduled.
  Each run deletes and creates the shared test data again, so two runs must not overlap today.
- Version endpoints: `/healthcheck`, `/kasittely/healthcheck` and `/monitoring/readiness/`.
  `scripts/release-check.sh` (TILA-4705) and `e2e/lib/app-versions-reporter.ts` read them already.
- `/monitoring/system-status/` checks only the DB, the cache, Redis and a Celery ping. It checks no external service.
- External services: Verkkokauppa, Pindora, Hauki, TPREK, Tunnistamo/Keycloak, Helsinki profile, SMTP,
  the Elasticsearch audit log and Varnish. Most clients extend `BaseExternalServiceClient`
  (`backend/utils/external_service/base_external_service_client.py`).
- Celery: 18 periodic tasks in `backend/tilavarauspalvelu/tasks.py`. About 10 of them call an external service.
  Results go to `django-db`. Nothing tells us when a task stops running or fails again and again.
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

Dev, test and stage use the same external instances with three different versions. So they separate code from service:

- dev shows changes on `main` that are not released yet.
- test shows the release candidate.
- stage is the control. It has the code of prod and the external instances of test.

## Main design point

The secrets and the network access for the external services are inside the cluster.
A GitHub runner must not hold the Pindora or Verkkokauppa keys.
So the service checks run in the backend, behind one endpoint.
The nightly job and the release pipelines only call that endpoint and put the results together.

## Decision table

| Dev | Test | Stage | Prod | Most likely cause |
|---|---|---|---|---|
| fail | pass | pass | any | A change on `main` that is not released. The job links `compare/<test version>...<dev version>`. |
| any | fail | pass | any | The release on test. The job links `compare/<prod version>...<test version>`. |
| fail | fail | fail | pass | The test instance of the external service is broken. Not urgent for us. |
| fail | fail | fail | fail | The external service itself, or a change on their side that affects both instances. |
| pass | pass | pass | fail | Prod config or the prod instance. Urgent. |

If stage and prod run different versions (hotfix case), the job shows a warning and the compare links use the stage version.

The direct probes mostly measure the external service. The Celery checks and the test e2e run find our own regressions.
The probes give the baseline that lets us trust that signal.

## Access and tokens

Order of preference:

1. **Target: tokens from a managed process.** For example a pipeline identity, a GitHub App or an Entra service principal.
   They do not belong to a person. The process to get them is not clear yet. It can take long or be impossible.
   This is the same open question as in the release plan (section 5, question 1).
2. **Fallback: a custom header with a shared secret.** It works like the WAF bypass header on test.
   It is harder to manage, because someone must rotate the secret by hand in the backend, GitHub and Azure.
   A header like this can also let the runner pass the geo block and similar checks. We have got such headers before, so far only for testing.
3. **PoC: public endpoints.** The version endpoints are public already.
   For the PoC the probe endpoint is public too, with these limits:
   - It returns only status, latency and error class for each check. No response body, no IDs, no config.
   - It caches the result for about 1 minute. Many calls then make only one round of outbound requests.

   The cost is that anyone can see which integration is down. This is acceptable for a PoC, not for the long run.

Design the endpoint so that adding the token later does not change the response or the callers, only one header.

Prod must be public to the runner. If there is no geo block, a GitHub runner can reach it.
Check this with one manual run of `release-check.sh` from a workflow before the nightly workflow PR.

## Parts

### 1. Probe endpoint for the external services

A new endpoint, for example `/monitoring/integrations/`. It is read only and safe on prod. Access follows "Access and tokens".

Each probe returns only status, HTTP code, latency and error class. It returns no response body,
because a body can have personal data. Each probe has a short timeout.

| Service | Probe |
|---|---|
| Verkkokauppa | `get_order` with a random UUID. A 404 means the service is up. Needs a variant that does not log to Sentry, because `get_order` logs errors through `SentryLogger`. |
| Pindora | GET of a reservation unit that has the access code type, taken from the DB. Skip the Redis cache. |
| Hauki | `get_resource` for the resource of a reservation unit, taken from the DB. |
| TPREK | `get_unit` for one unit, taken from the DB. |
| Tunnistamo/Keycloak | Fetch the OIDC discovery document. |
| Helsinki profile | No anonymous read call exists. Check only that the endpoint answers, for example with 401. The test e2e login flow covers the full path. |
| SMTP | Connect, send EHLO and NOOP. Send no mail. |
| Audit log | Count resilient_logger entries that are still unsent after N hours. A growing count means Elasticsearch is broken. |

The probes take their IDs from the DB, so no config per environment is needed.

### 2. Celery checks

A section in the same endpoint. For each periodic task it reports the last run (`PeriodicTask.last_run_at`)
and the last `TaskResult` state. It flags a task that is overdue or that fails.

This also catches a worker or scheduler that does not come back after a deploy (see the worker order bugs in TILA-4699).

Optional: send one no-op task and wait for its result. This proves the path from broker to worker to result.
It is harmless on prod.

Optional symptom counts. These are cheap DB reads. Examples:

- reservations that need an access code but have none
- payment orders still pending after they expired
- unsent emails in the queue

Sentry Crons can replace or extend this section later. See the open questions.

### 3. Nightly workflow

A new GitHub workflow with a cron at about 04:00 Helsinki time.

1. Read the versions of dev, test, stage and prod with the existing endpoints.
2. Call the probe endpoint on dev, test, stage and prod.
3. Run the e2e suite on test through `run-e2e.yml` with `workflow_call` (the same entry point as Release e2e).
4. Write the job summary with the decision table and the compare links.
5. For each failed check, send one Sentry event with `sentry-cli send-event`.
   Use the fingerprint `nightly:<env>:<check>`. Add tags for the versions and the compare links.

### 4. Integration flows in the test e2e suite

First check what the suite covers today. Then add one flow for each mutating integration that is missing:

- a paid reservation that creates a Verkkokauppa order
- a reservation with an access code that creates and deletes the Pindora reservation
- email checks through `/v1/robot_email_cache/`. The notification tests use this already.

These flows also help the "simple" release rule in the release plan (3.2). The rule needs a test plan with no item that e2e does not cover.

### 5. Parallel e2e runs

Three workflows now run the e2e suite on test: manual "E2E tests", "Release e2e" and the nightly run.
Today each run deletes and creates the shared test data, so the runs must not overlap.

GitHub `concurrency` allows one running and one pending run per group. A newer pending run replaces the older pending one.
So a shared group can cancel a release run or a nightly run without a clear sign. Do not use it to queue the runs.

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

- Call the probe endpoint and the Celery section on prod after each deploy and every night.
- A Playwright project loads the front page, runs a search, and opens a reservation unit page
  that shows the first reservable time (Hauki data). It does not log in. A prod login needs real strong authentication.

### 7. Notifications

A developer can create a Slack app but cannot install it (tested 20.11.2026, see the release plan 3.6).
The Sentry bot and the GitHub bot work.

- Sentry: one issue per broken check, from the fixed fingerprint. "First seen" shows when it started.
  A new event each night shows that it continues. Resolve the issue when the check is fixed.
  If it breaks again, Sentry marks a regression. An alert rule on these fingerprints sends to Slack.
  Create the rule disabled and turn it on after a check in the web UI.
  The DSN does not belong to a person, so it fits the token rules in the release plan.
- GitHub Slack app: subscribe the channel to failures of the nightly workflow, with a workflow filter.
  The release plan uses the same subscription for "Release e2e". One test of the filter syntax covers both.

## Links to the release plan

| Release plan | Link to this plan |
|---|---|
| 3.1 Release e2e workflow | Before the e2e run, call the probe endpoint on test and stage. Add the decision table to the result. A red run then shows if the tag or an external service is the cause. An external outage does not block a release or mark it "not simple". |
| 3.1 `workflow_call` in `run-e2e.yml` | The nightly run uses the same entry point. |
| 3.2 "Simple" release rule | The integration flows in part 4 cover more of the test plan. |
| 3.5 Slack, GitHub app subscription | Same fallback for the nightly workflow. |
| 3.6 Tokens, polling with no tokens | Public endpoints for the PoC. Real tokens are the target (see "Access and tokens"). |
| TILA-4705 Release check script | The nightly workflow needs the version endpoints in prod. Same blocker as Release e2e. |
| TILA-4669 Prod smoke check | Uses the probe endpoint and the Celery section (part 6). The probe endpoint PR blocks it. |
| TILA-4699 Faster backend deploy | The Celery section finds a worker or scheduler that did not come back. |

## PR stack

One ticket per PR.

1. Probe endpoint for the external services, with tests. Public with a cache for the PoC.
2. Celery section in the same endpoint
3. Nightly workflow: versions and probes on dev, test, stage and prod, the decision table, Sentry events
4. Schedule the test e2e run through `workflow_call`, and add the missing integration flows
5. Parallel e2e runs: stable data, random future slots, conflict handling, skip and priority rules
6. Read-only prod checks with TILA-4669
7. Sentry alert rule to Slack, and the GitHub Slack subscription as a backup
8. Later: replace the public access with a token (see "Access and tokens")

## Long term

Get dedicated IPs or dedicated GitHub runners that pass the geo block and similar checks.
A header token (see "Access and tokens") can also do this.
This is 1 to 2 years away. Until then, check those cases by hand while the project is active.

## Open questions

- How do we get a token from a managed process for the pipelines? Who approves it? Same as release plan question 1.
- Who owns the Sentry plan, and does Sentry Crons fit the quota? If yes, limit it to prod and test,
  and to the tasks that call external services (about 10 monitors).
- Which Slack channel gets the alerts?
- Can an admin install a Slack app for us? This is not needed if the Sentry and GitHub bots are enough.
