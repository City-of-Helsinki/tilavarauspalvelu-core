---
name: github-job
description: >-
  Fetch a GitHub Actions job or workflow run through the GitHub REST API and present its status and failure details.
  Use when the user references a CI job, pipeline, or workflow run, either with a URL or an id.
---

How to fetch a GitHub Actions job or run to diagnose a failure or check status.

## 1. Authentication

Use `gh` CLI. Check auth once, before anything else:

```bash
gh auth status
```

If not installed, stop and ask the user to install `gh`.
If not logged in, stop and ask the user to run `gh auth login`.

## 2. Parse the id

Case 1: User says "run 123" or "check run #123" → run id=123

Case 2: User says "job 456" or "check job #456" → job id=456

Case 3: User gives a URL:

1. `https://github.com/City-of-Helsinki/tilavarauspalvelu-core/actions/runs/123` → run id=123
2. `https://github.com/City-of-Helsinki/tilavarauspalvelu-core/actions/runs/123/job/456` → job id=456

## 3. Find the job id

If you have a job id, skip to step 4.

If you have a run id, list only the failed jobs in the run:

```bash
gh run view <run_id> --repo City-of-Helsinki/tilavarauspalvelu-core --json databaseId,status,conclusion,url,jobs --jq '{run: {id: .databaseId, status, conclusion, url}, jobs: [.jobs[] | select(.conclusion=="failure") | {id: .databaseId, name, status, conclusion, url}]}'
```

Take the id of the job that needs attention (`conclusion: "failure"`).

## 4. Fetch the log

```bash
gh run view --job <job_id> --repo City-of-Helsinki/tilavarauspalvelu-core --log
```

## 5. Fetch job metadata (only if needed)

Fetch this only if the log is empty or you cannot determine the failure from it.

```bash
gh api repos/City-of-Helsinki/tilavarauspalvelu-core/actions/jobs/<job_id> --jq '{id, name, status, conclusion, started_at, completed_at, html_url}'
```
