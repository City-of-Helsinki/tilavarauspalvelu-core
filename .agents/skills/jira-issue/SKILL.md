---
name: jira-issue
description: >-
  Fetch a Jira issue through the Jira Cloud REST API and present its details.
  Use when the user references a Jira issue either with a URL or a key like TILA-123.
---

How to fetch a Jira issue for implementation details, either to show or implement.

## 1. Authentication

The `jira-issue` script next to this file reads the credentials from 1Password with `op read`.
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

## 2. Fetch the issue

Run the script from the repository root. Give it the key or the URL from the user as is.
Put a URL in single quotes:

```bash
.agents/skills/jira-issue/jira-issue TILA-123
.agents/skills/jira-issue/jira-issue 'https://helsinkisolutionoffice.atlassian.net/browse/TILA-123'
```

The script validates the key and fetches the issue with all its comments.
A hook blocks the command if it is in any other form. Run it as a single command, without pipes.

The description and comments are plain wiki markup text. Issues are often in Finnish.
