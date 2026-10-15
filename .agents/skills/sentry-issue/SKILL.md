---
name: sentry-issue
description: >-
  Fetch a Sentry issue and one of its events through the Sentry REST API and present its details.
  Use when the user references a Sentry issue either with a URL or an issue ID.
---

How to fetch a Sentry issue to find the cause of an error.

## 1. Authentication

The `sentry-issue` script next to this file reads the token from 1Password with `op read`.
1Password asks the user to unlock. Wait for it.

The script needs this setup. If a call fails because of it, stop and tell the user which part is missing:

- `op` (1Password CLI) is installed.
- The 1Password desktop app has Settings → Developer → "Integrate with 1Password CLI" turned on.
- The 1Password vault has an "API Credential" item. `credential` is a personal token from
  https://city-of-helsinki.sentry.io/settings/account/api/auth-tokens/ with the `event:read`,
  `org:read` and `project:read` scopes.
- The user's shell profile sets these variables:

| Variable                  | Meaning                                               |
|---------------------------|-------------------------------------------------------|
| `SENTRY_ISSUE_OP_ACCOUNT` | 1Password account, for example `vincit.1password.eu`. |
| `SENTRY_ISSUE_OP_VAULT`   | Vault that has the item, for example `Private`.       |
| `SENTRY_ISSUE_OP_ITEM`    | Name of the item, for example `Sentry API PAT`.       |

Never print the token or call `op` for it yourself. Use only the script.

## 2. Fetch the issue

Run the script from the repository root. Give it the issue ID or the URL from the user as is.
Put a URL in single quotes:

```bash
.agents/skills/sentry-issue/sentry-issue 153768154
.agents/skills/sentry-issue/sentry-issue 'https://city-of-helsinki.sentry.io/issues/153768154/?project=4511422016192592'
```

The script fetches the issue and one event. The event is the one in the URL, or the latest event.
A hook blocks the command if it is in any other form. Run it as a single command, without pipes.

Stack frames are oldest first. Only in-app frames have code context.
Use the `release` and `environment` tags to find the code version the error came from.
