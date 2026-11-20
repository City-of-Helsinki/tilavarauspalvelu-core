# Nightly checks of external services and Celery

Status: planning. Nothing is built yet.

## Problem

When a check on the test environment fails, we do not know the cause. It can be a change we pushed to test.
It can also be an external service that broke. Sometimes the external service was already broken and the failure was expected.

## Goal

Every night, before the team starts work, run checks for:

- each external service the backend calls
- each Celery task, mostly the periodic ones
- the user flows of the existing e2e suite, on test only

Then show which environment fails, which version it runs, and what the most likely cause is.
Checks on prod must be read only. Checks on test can make changes.

## What exists today

- e2e suite in `e2e/`. It is Playwright and targets `varaamo.test.hel.ninja`.
  `run-e2e.yml` runs it only when started by hand (`workflow_dispatch`). No e2e workflow is scheduled.
  Each run deletes and creates the shared test data again, so two runs must not overlap.
- Version endpoints: `/healthcheck`, `/kasittely/healthcheck` and `/monitoring/readiness/`.
  `scripts/release-check.sh` and `e2e/lib/app-versions-reporter.ts` read them already.
- `/monitoring/system-status/` checks only the DB, the cache, Redis and a Celery ping. It checks no external service.
- External services: Verkkokauppa, Pindora, Hauki, TPREK, Tunnistamo/Keycloak, Helsinki profile, SMTP,
  the Elasticsearch audit log and Varnish. Most clients extend `BaseExternalServiceClient`
  (`backend/utils/external_service/base_external_service_client.py`).
- Celery: 18 periodic tasks in `backend/tilavarauspalvelu/tasks.py`. About 10 of them call an external service.
  Results go to `django-db`. Nothing tells us when a task stops running or fails again and again.
- Sentry is on sentry.io SaaS. There are no cron monitors yet.

## Environments and external service instances

Local, dev, test and stage all use the test instances of the external services. Only prod uses the prod instances.

Stage always runs the same version as prod. The only exception is a hotfix that must skip test.
That gap closes in a few hours.

This makes stage the control environment. It has the same external instances as test and the same code as prod.

## Main design point

The secrets and the network access for the external services are inside the cluster.
A GitHub runner must not hold the Pindora or Verkkokauppa keys.
So the service checks run in the backend, behind one protected endpoint.
The nightly job only calls that endpoint on each environment and puts the results together.

## Decision table

| Test | Stage | Prod | Most likely cause |
|---|---|---|---|
| fail | pass | any | Our change. The job links `compare/<prod version>...<test version>`. |
| fail | fail | pass | The test instance of the external service is broken. Not urgent for us. |
| fail | fail | fail | The external service itself, or a change on their side that affects both instances. |
| pass | pass | fail | Prod config or the prod instance. Urgent. |

If stage and prod run different versions (hotfix case), the job shows a warning and the compare link uses the stage version.

The direct probes mostly measure the external service. The Celery checks and the test e2e run find our own regressions.
The probes give the baseline that lets us trust that signal.

## Parts

### 1. Probe endpoint for the external services

A new endpoint, for example `/monitoring/integrations/`. It needs a token on every environment,
because each call makes outbound requests. It is read only and safe on prod.

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

Optional: send one no-op task and wait for its result. This proves the path from broker to worker to result.
It is harmless on prod.

Optional symptom counts. These are cheap DB reads. Examples:

- reservations that need an access code but have none
- payment orders still pending after they expired
- unsent emails in the queue

Sentry Crons can replace or extend this section later. See the open questions.

### 3. Nightly workflow

A new GitHub workflow with a cron at about 04:00 Helsinki time.

1. Read the versions of test, stage and prod with the existing endpoints.
2. Call the probe endpoint on test, stage and prod.
3. Run the existing e2e suite on test. Use the same concurrency group as `run-e2e.yml`.
4. Write the job summary with the decision table and the compare link.
5. For each failed check, send one Sentry event with `sentry-cli send-event`.
   Use the fingerprint `nightly:<env>:<check>`. Add tags for the versions and the compare link.

### 4. Integration flows in the test e2e suite

First check what the suite covers today. Then add one flow for each mutating integration that is missing:

- a paid reservation that creates a Verkkokauppa order
- a reservation with an access code that creates and deletes the Pindora reservation
- email checks through `/v1/robot_email_cache/`. The notification tests use this already.

### 5. Read-only smoke project for prod

A Playwright project that loads the front page, runs a search, and opens a reservation unit page
that shows the first reservable time (Hauki data). It does not log in.
A prod login needs real strong authentication.

### 6. Notifications

We cannot create new Slack bots now. This is a permission issue that we can maybe solve.
The Sentry bot and the GitHub bot work.

- Sentry: one issue per broken check, from the fixed fingerprint. "First seen" shows when it started.
  A new event each night shows that it continues. Resolve the issue when the check is fixed.
  If it breaks again, Sentry marks a regression. An alert rule on these fingerprints sends to Slack.
  Create the rule disabled and turn it on after a check in the web UI.
- GitHub Slack app: subscribe the channel to failures of the nightly workflow.
  This catches the case where the job breaks before it reaches Sentry.

## PR stack

One ticket per PR.

1. Probe endpoint for the external services, with tests
2. Celery section in the same endpoint
3. Nightly workflow: versions and probes on test, stage and prod, the decision table, Sentry events
4. Schedule the test e2e run, and add the missing integration flows
5. Read-only smoke project for prod
6. Sentry alert rule to Slack, and the GitHub Slack subscription as a backup

## Access to prod from GitHub

Prod must be public. If there is no geo block, a GitHub runner can reach it.
Check this with one manual run of `release-check.sh` from a workflow before PR 3.

## Long term

Get dedicated IPs or dedicated GitHub runners that pass the geo block and similar checks.
This is 1 to 2 years away. Until then, check those cases by hand while the project is active.

## Open questions

- Who owns the Sentry plan, and does Sentry Crons fit the quota? If yes, limit it to prod and test,
  and to the tasks that call external services (about 10 monitors).
- Which Slack channel gets the alerts?
- Can we get permission to create a Slack bot? This is not needed if the Sentry and GitHub bots are enough.
