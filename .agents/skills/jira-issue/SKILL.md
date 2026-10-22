---
name: jira-issue
description: >-
  Fetch, list, change or create Jira issues through the Jira Cloud REST API.
  Use when the user references a Jira issue or epic with a URL or a key like TILA-123,
  asks to list the issues of an epic, asks to edit, label or link an issue, or asks to create an issue.
---

How to read, list, change and create Jira issues.

## 1. Authentication

The scripts next to this file read the credentials from 1Password with `op read`.
1Password asks the user to unlock. Wait for it.

The scripts need this setup. If a call fails because of it, stop and tell the user which part is missing:

- `op` (1Password CLI) is installed.
- The 1Password desktop app has Settings → Developer → "Integrate with 1Password CLI" turned on.
- The 1Password vault has an "API Credential" item. `username` is the Atlassian email. `credential` is an API token from https://id.atlassian.com/manage-profile/security/api-tokens.
- The user's shell profile sets these variables:

| Variable                | Meaning                                               |
|-------------------------|-------------------------------------------------------|
| `JIRA_ISSUE_OP_ACCOUNT` | 1Password account, for example `vincit.1password.eu`. |
| `JIRA_ISSUE_OP_VAULT`   | Vault that has the item, for example `Private`.       |
| `JIRA_ISSUE_OP_ITEM`    | Name of the item, for example `Jira API key`.         |

Never print the credentials or call `op` for them yourself. Use only the scripts.

## 2. Run a script

Run the scripts from the repository root. Give them the keys or URLs from the user as is.
Put URLs and free text in single quotes. A hook blocks the command if it is in any other form.
Run each script as a single command, without pipes.

Issues are often in Finnish. Descriptions and comments are Jira wiki markup.

### Fetch an issue

```bash
.agents/skills/jira-issue/jira-issue TILA-123
.agents/skills/jira-issue/jira-issue 'https://helsinkisolutionoffice.atlassian.net/browse/TILA-123'
```

Prints the issue with all its comments as JSON.

### List the child issues of an epic

```bash
.agents/skills/jira-issue/jira-epic TILA-123
.agents/skills/jira-issue/jira-epic TILA-123 --with-description
```

Prints a JSON list with one object for each child issue, sorted by key.
Each object has the key, URL, summary, type, status, assignee, labels and links.
Each link has the link type, the direction from the child issue (for example "is blocked by") and the other issue key.

Add `--with-description` to also get each description. The output is much longer with descriptions.
To read one child issue with its comments, use `jira-issue`.

### Change an issue

```bash
.agents/skills/jira-issue/jira-update TILA-123 --add-label backend --blocks TILA-124 --dry-run
.agents/skills/jira-issue/jira-update 'https://helsinkisolutionoffice.atlassian.net/browse/TILA-123' --relates TILA-124 --dry-run
```

Give the issue first, then one or more options. Each run changes only the parts you give.

| Option                      | Repeat | Change                                                 |
|-----------------------------|--------|--------------------------------------------------------|
| `--summary <text>`          | no     | Replace the summary (the title). One line.             |
| `--description-file <path>` | no     | Replace the description with the contents of the file. |
| `--add-label <label>`       | yes    | Add a label. The other labels stay.                    |
| `--remove-label <label>`    | yes    | Remove a label. The other labels stay.                 |
| `--blocks <key>`            | yes    | Add a link: this issue blocks `<key>`.                 |
| `--blocked-by <key>`        | yes    | Add a link: this issue is blocked by `<key>`.          |
| `--relates <key>`           | yes    | Add a link: this issue relates to `<key>`.             |
| `--remove-link <key>`       | yes    | Remove every link between this issue and `<key>`.      |
| `--dry-run`                 | no     | Print the requests. Send nothing.                      |

The script skips a label or link that is already as requested and prints a "Skipped" line for it.
To keep parts of the old description, fetch the issue with `jira-issue` first and edit its text.

### Create an issue

```bash
.agents/skills/jira-issue/jira-create --summary 'Fix the login redirect' --parent TILA-123 --label frontend --dry-run
```

| Option                      | Repeat | Value                                                       |
|-----------------------------|--------|-------------------------------------------------------------|
| `--summary <text>`          | no     | The summary. Required. One line.                            |
| `--type <name>`             | no     | The issue type. Default `Task`.                             |
| `--parent <key>`            | no     | The parent issue, usually the epic.                         |
| `--project <key>`           | no     | The project. Default `TILA`.                                |
| `--description-file <path>` | no     | The description from the contents of the file.              |
| `--label <label>`           | yes    | Add a label.                                                |
| `--blocks <key>`            | yes    | Add a link: the new issue blocks `<key>`.                   |
| `--blocked-by <key>`        | yes    | Add a link: the new issue is blocked by `<key>`.            |
| `--relates <key>`           | yes    | Add a link: the new issue relates to `<key>`.               |
| `--dry-run`                 | no     | Print the requests. Send nothing.                           |

The script checks the type against the types of the project. An error lists the allowed types.
It creates the issue first, then the links. In a dry run, `NEW-ISSUE` stands for the new key.
After a real run, it prints the new key and URL.

## 3. Rules for changes

`jira-update` and `jira-create` write to Jira. Run them with `--dry-run` first.
Show the preview to the user. Run the same command without `--dry-run` only after the user approves it.

The allowed labels are `backend`, `frontend`, `operations`, `infra` and `design`.
A key option takes a key or a URL.

Write a description in Jira wiki markup, the same format that `jira-issue` prints.
Write it to a new file in `/tmp`, then give the file path. A file keeps quotes and line breaks safe.

After a real run, the script prints one line for each change that it made.
If a request fails, the lines before the error show the changes that are already done.
