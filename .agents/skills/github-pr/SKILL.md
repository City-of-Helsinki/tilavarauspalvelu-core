---
name: github-pr
description: >-
  Fetch a GitHub pull request through the GitHub REST API and present its details and review
  comments with the file and line each comment references.
  Use when the user references a pull request or PR either with a URL or number.
  Also use to fetch the code of a pull request for a review.
  Also use when the user asks which pull requests they or the whole team opened,
  merged or reviewed in a time window, for example the past two weeks.
---

How to fetch a GitHub pull request to show its details or review comments.

## 1. Authentication

Use `gh` CLI. If `gh` is not installed, stop and ask the user to install it.

If the file `/run/secrets/gh/token` exists, the script gives `gh` the token from it.
Use this in a container. Then `gh auth status` says that `gh` is not logged in. This is fine.
Never print the token or read the file yourself. Use only the script.

If the file does not exist, check auth once, before anything else:

```bash
gh auth status
```

If not logged in, stop and ask the user to run `gh auth login`.

## 2. Fetch the pull request

Run the script from the repository root. Give it the number or the URL from the user as is.
Put a URL in single quotes:

```bash
.agents/skills/github-pr/github-pr 99
.agents/skills/github-pr/github-pr 'https://github.com/City-of-Helsinki/tilavarauspalvelu-core/pull/99'
```

The script validates the number. It prints the pull request with three lists of comments:

- `reviews` are review summaries. A URL with `#pullrequestreview-<id>` points to the review with that `id`.
- `review_comments` are tied to a file and a line. A URL with `#discussion_r<id>` points to the review comment with that `id`.
- `comments` are general comments on the pull request.

A hook blocks the command if it is in any other form. Run it as a single command, without pipes.

## 3. Fetch the code of the pull request

Use this to review a pull request without a checkout. The script needs no clean working tree.

```bash
.agents/skills/github-pr/github-pr-fetch 99
```

The script fetches the head of the pull request to `refs/pr/<number>/head`
and its base branch to `refs/pr/<number>/base`. It prints JSON with `head_ref`, `head_sha`, `base_branch`,
`base_ref`, `merge_base` and `files`. Each file has `path`, `added` and `deleted`.
Read the code with plain git commands after that:

```bash
git diff <merge_base> refs/pr/99/head -- <path>
git show refs/pr/99/head:<path>
git grep <pattern> refs/pr/99/head -- backend/
```

Run the script again to get new commits. It overwrites the refs.

## 4. List your pull requests or the team's in a time window

```bash
.agents/skills/github-pr/github-activity
.agents/skills/github-pr/github-activity --since 2026-11-01 --until 2026-11-15
.agents/skills/github-pr/github-activity --team --summary-only
```

| Option           | Value                                                                           |
|------------------|---------------------------------------------------------------------------------|
| `--team`         | All people (not bots), with totals for the team. Without it, your own work.     |
| `--since <date>` | The first day, `YYYY-MM-DD`. Default 14 days ago.                               |
| `--until <date>` | The last day, `YYYY-MM-DD`. Default today.                                      |
| `--summary-only` | Print only the counts, not the pull requests.                                   |

The script shows only your own work or the team totals. It has no option for the work of another person.
The team agreed on this, because nobody uses the summaries to report on or follow other people.
If the user asks for the work of another person, tell them this and do not work around it.

The script prints JSON with a `summary` and two lists:

- `authored` has the pull requests that you opened or merged in the window, and your open ones.
- `reviewed` has the pull requests of other people that you reviewed in the window, with each review.
- `summary` counts the pull requests opened and merged in the window, the ones open now,
  the reviewed pull requests and the reviews.
- For `--team`, the lists and counts cover all people, and the output does not name the persons.

Each pull request has `jira`, the Jira keys in its title, branch and description.
Many pull requests have no key. To find the ticket of such a pull request, compare its title with
the issues from `jira-activity` in the `jira-issue` skill.

The dates are in UTC. Work just after midnight in Helsinki counts for the day before.
