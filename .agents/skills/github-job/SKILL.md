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

## 2. Fetch the run or job

Run the script from the repository root. Give it the id or the URL from the user as is.
Put a URL in single quotes. A hook blocks the command if it is in any other form.
Run it as a single command, without pipes.

If the user gives a job id or a URL with `/job/<id>`, skip to step 3.

If the user gives a run id or a run URL, list the failed jobs in the run:

```bash
.agents/skills/github-job/github-job run 123
.agents/skills/github-job/github-job run 'https://github.com/City-of-Helsinki/tilavarauspalvelu-core/actions/runs/123'
```

Take the id of the job that needs attention (`conclusion: "failure"`).

## 3. Fetch the log

```bash
.agents/skills/github-job/github-job log 456
.agents/skills/github-job/github-job log 'https://github.com/City-of-Helsinki/tilavarauspalvelu-core/actions/runs/123/job/456'
```

## 4. Fetch job metadata (only if needed)

Fetch this only if the log is empty or you cannot determine the failure from it.

```bash
.agents/skills/github-job/github-job info 456
```
