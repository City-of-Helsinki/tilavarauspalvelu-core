---
name: confluence
description: >-
  Fetch, list and search Confluence pages and spaces through the Confluence Cloud REST API.
  Use when the user references a Confluence page or space with a URL, page ID or space key,
  or asks to find something in Confluence.
---

How to navigate Confluence, either to show pages or to use them as a source.

## 1. Authentication

The scripts next to this file read the credentials from 1Password with `op read`.
1Password asks the user to unlock. Wait for it.

The scripts need this setup. If a call fails because of it, stop and tell the user which part is missing:

- `op` (1Password CLI) is installed.
- The 1Password desktop app has Settings → Developer → "Integrate with 1Password CLI" turned on.
- The 1Password vault has an "API Credential" item. `username` is the Atlassian email. `credential` is an API token from https://id.atlassian.com/manage-profile/security/api-tokens.
  The same token works for Jira and Confluence.
- The user's shell profile sets these variables:

| Variable                | Meaning                                               |
|-------------------------|-------------------------------------------------------|
| `JIRA_ISSUE_OP_ACCOUNT` | 1Password account, for example `vincit.1password.eu`. |
| `JIRA_ISSUE_OP_VAULT`   | Vault that has the item, for example `Private`.       |
| `JIRA_ISSUE_OP_ITEM`    | Name of the item, for example `Jira API key`.         |

Never print the credentials or call `op` for them yourself. Use only the scripts.

## 2. Run a script

Run the scripts from the repository root. Give them the ID, key or URL from the user as is.
Put URLs and search text in single quotes. A hook blocks the command if it is in any other form.
Run each script as a single command, without pipes.

Varaamo's own pages are under [Tilavarauspalvelu / Varaamo](https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/887029864/Tilavarauspalvelu+Varaamo)
in the `KAN` space. Start there unless the user names another page or space.

Pages are often in Finnish. Tiny links like `/wiki/x/...` are not supported. Ask the user for the full URL.

### Fetch a page

```bash
.agents/skills/confluence/confluence-page 887029864
.agents/skills/confluence/confluence-page 'https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/pages/887029864/Tilavarauspalvelu+Varaamo'
```

Prints the page with its ancestors, child pages and all footer comments as JSON.
The body and comments are Confluence storage format, which is XHTML with `ac:` macro tags.
Use the IDs in `ancestors` and `children` to move up and down the page tree.

### List spaces or the pages in a space

```bash
.agents/skills/confluence/confluence-space
.agents/skills/confluence/confluence-space KAN
.agents/skills/confluence/confluence-space 'https://helsinkisolutionoffice.atlassian.net/wiki/spaces/KAN/overview'
```

With no argument, prints one line per space as `<key>  <name>`.
With a space, prints its page tree as `<page ID>  <title>`, indented by depth.

### Search

```bash
.agents/skills/confluence/confluence-search 'varaamo'
.agents/skills/confluence/confluence-search 'varaamo' KAN
```

Full-text search for pages, optionally in one space. Prints the first 50 matches as JSON, with an excerpt of each.
