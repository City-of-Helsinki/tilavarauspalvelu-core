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

## 2. Fetch the pull request

Run the script from the repository root. Give it the number or the URL from the user as is.
Put a URL in single quotes:

```bash
.agents/skills/github-pr/github-pr 99
.agents/skills/github-pr/github-pr 'https://github.com/City-of-Helsinki/tilavarauspalvelu-core/pull/99'
```

The script validates the number. It prints the pull request with two lists of comments:

- `review_comments` are tied to a file and a line. A URL with `#discussion_r<id>` points to the review comment with that `id`.
- `comments` are general comments on the pull request.

A hook blocks the command if it is in any other form. Run it as a single command, without pipes.
