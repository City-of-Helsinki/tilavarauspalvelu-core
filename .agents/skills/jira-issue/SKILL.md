---
name: jira-issue
description: >-
  Fetch a Jira issue through the Jira Cloud REST API and present its details.
  Use when the user references a Jira issue either with a URL or a key like TILA-123.
---

How to fetch a Jira issue for implementation details, either to show or implement.

## 1. Authentication

The `jira-api` script next to this file reads the credentials from 1Password with `op read`.
1Password asks the user to unlock. Wait for it.

The script needs this setup. If a call fails because of it, stop and tell the user which part is missing:

- `op` (1Password CLI) is installed.
- The 1Password desktop app has Settings → Developer → "Integrate with 1Password CLI" turned on.
- The 1Password vault has an "API Credential" item. `username` is the Atlassian email. `credential` is an API token from https://id.atlassian.com/manage-profile/security/api-tokens.
- The user's shell profile sets these variables:

| Variable                | Default        | Meaning                                               |
|-------------------------|----------------|-------------------------------------------------------|
| `JIRA_ISSUE_OP_ACCOUNT` | none, required | 1Password account, for example `vincit.1password.eu`. |
| `JIRA_ISSUE_OP_VAULT`   | `Private`      | Vault that has the item.                              |
| `JIRA_ISSUE_OP_ITEM`    | `Jira API key` | Name of the item.                                     |

Never print the credentials or call `op` for them yourself. Use only the script.

## 2. Parse the key

Case 1: User says "Fetch TILA-123" or "Implement TILA-123" → key=TILA-123

Case 2: User says "Fetch <URL>":

`https://helsinkisolutionoffice.atlassian.net/browse/TILA-123` → key=TILA-123

`https://helsinkisolutionoffice.atlassian.net/jira/software/c/projects/TILA/boards/247/backlog?selectedIssue=TILA-123` → key=TILA-123.

Take the key from the `selectedIssue` query parameter. Ignore the other parameters.

## 3. Call the API

Run from the repository root:

```bash
.agents/skills/jira-issue/jira-api 'rest/api/2/issue/<key>?fields=summary,status,issuetype,priority,assignee,reporter,labels,parent,created,updated,description,comment' | jq '{key, url: "https://helsinkisolutionoffice.atlassian.net/browse/\(.key)", summary: .fields.summary, type: .fields.issuetype.name, status: .fields.status.name, priority: .fields.priority.name, assignee: .fields.assignee.displayName, reporter: .fields.reporter.displayName, labels: .fields.labels, parent: .fields.parent.key, created: .fields.created, updated: .fields.updated, description: .fields.description, comment_total: .fields.comment.total, comments: [.fields.comment.comments[] | {author: .author.displayName, at: .created, body}]}'
```

If `comment_total` is larger than the number of `comments`, the response has only the first page.
Fetch the rest with `startAt` set to the number of comments you already have. Repeat until you have all of them:

```bash
.agents/skills/jira-issue/jira-api 'rest/api/2/issue/<key>/comment?startAt=<count>' | jq '{total, comments: [.comments[] | {author: .author.displayName, at: .created, body}]}'
```

API v2 returns the description and comments as plain wiki markup text. Issues are often in Finnish.
