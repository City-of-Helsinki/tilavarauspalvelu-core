---
name: github-pr
description: >-
  Fetch a GitHub pull request through the GitHub REST API and present its details and review
  comments with the file and line each comment references.
  Use when the user references a pull request or PR either with a URL or number.
---

How to fetch a GitHub pull request to show its details or review comments.

## 1. Authentication

Use `gh` CLI. Check auth once, before anything else:

```bash
gh auth status
```

If not installed, stop and ask the user to install `gh`.
If not logged in, stop and ask the user to run `gh auth login`.

## 2. Parse the number

Case 1: User says "PR 99" or "pull request #99" → number=99

Case 2: User says "Fetch <URL>":

`https://github.com/City-of-Helsinki/tilavarauspalvelu-core/pull/99` → number=99

## 3. Call the API

```bash
gh pr view <number> --repo City-of-Helsinki/tilavarauspalvelu-core --json number,title,state,author,baseRefName,headRefName,url,isDraft,body --jq '{number, title, state, author: .author.login, source_branch: .headRefName, target_branch: .baseRefName, web_url: .url, draft: .isDraft, description: .body}'
```

Fetch the line-specific review comments separately:

```bash
gh api repos/City-of-Helsinki/tilavarauspalvelu-core/pulls/<number>/comments --jq '[.[] | {author: .user.login, at: .created_at, file: .path, line: (.line // .original_line), body}]'
```

General PR-level comments, not tied to a diff line, come from the issue comments endpoint:

```bash
gh api repos/City-of-Helsinki/tilavarauspalvelu-core/issues/<number>/comments --jq '[.[] | {author: .user.login, at: .created_at, body}]'
```
