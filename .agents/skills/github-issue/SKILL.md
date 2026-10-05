---
name: github-issue
description: >-
  Fetch a GitHub issue through the GitHub REST API and present its details.
  Use when the user references a GitHub issue either with a URL or number.
---

How to fetch a GitHub issue for implementation details, either to show or implement.

## 1. Authentication

Use `gh` CLI. Check auth once, before anything else:

```bash
gh auth status
```

If not installed, stop and ask the user to install `gh`.
If not logged in, stop and ask the user to run `gh auth login`.

## 2. Parse the number

Case 1: User says "Fetch issue 123" or "Implement issue #123" → number=123

Case 2: User says "Fetch <URL>":

`https://github.com/City-of-Helsinki/tilavarauspalvelu-core/issues/123` → number=123

## 3. Call the API

```bash
gh issue view <number> --repo City-of-Helsinki/tilavarauspalvelu-core --json number,title,state,author,assignees,labels,milestone,createdAt,updatedAt,url,body,comments --jq '{number, title, state, author: .author.login, assignees: [.assignees[].login], labels: [.labels[].name], milestone: .milestone.title, created_at: .createdAt, updated_at: .updatedAt, web_url: .url, description: .body, notes: [.comments[] | {author: .author.login, at: .createdAt, body}]}'
```
