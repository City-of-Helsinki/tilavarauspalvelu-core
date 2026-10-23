---
name: watch-pr
description: Watch a pull request until it merges. Fix failed CI checks, answer review comments, and rebase onto the base branch as they come in.
disable-model-invocation: true
argument-hint: <PR number or URL>
---

The user ran this skill on purpose. For this pull request only, it gives you the right to:

- Commit and push to its branch. Rebase it, and push with `--force-with-lease`.
- Post comments, reply to review comments, and resolve review threads.

Merging is the user's call. Leave the pull request unmerged. A comment that is exactly `/ff` or `/fast-forward` merges it.

A script does all the polling. It wakes you only with news: a check failed, the required checks passed,
someone commented or reviewed, or the branch fell behind its base or started to conflict. Between wakes, end your turn.

## Identify as the agent

You act through the user's GitHub account, so every comment you post must say that an agent wrote it.
Start every comment and reply with these two lines:

```markdown
<!-- watch-pr:agent -->
*Written by an AI assistant (Claude) working as @<login>'s agent.*
```

`<login>` is the login that `watch-pr start` prints. The script skips comments with the marker.
A comment without it wakes you on your own words.

End every commit message with this trailer:

```text
Co-Authored-By: Claude <noreply@anthropic.com>
```

## 1. Start the watch

Check `gh auth status`. If it fails, stop and ask the user to run `gh auth login`.

Check that the current branch is the head branch of the pull request. If it is not, stop and ask the user.

Run the script from the repository root:

```bash
.agents/skills/watch-pr/watch-pr start <number or URL>
```

The watch counts comments from this moment.

## 2. Read the context

Read the pull request and its comments with the `github-pr` skill.

The description follows the pull request template, and its sections can be unfilled.
The "Tickets" section can link Jira tickets. A link to `TILA-` with no number is the unfilled template, not a ticket.
Read every linked ticket in full with the `jira-issue` skill, including all its comments.
The ticket tells you the intent behind the change. Use it to judge if a review comment is correct and in scope.

A ticket can have only a title. Then the implementer decided the details, and the code in the pull request is the intent.

Done when you have read the description and every linked ticket.

## 3. Handle what is already there

Older comments and failures do not wake you, so handle them now. Every review comment that has no answer yet is an item.

The first wait in step 4 reports checks that already failed or passed. Leave checks to that wake.

Done when every older item has a fix or a reply.

## 4. Wait for news

Run this with the Bash tool and `run_in_background: true`:

```bash
.agents/skills/watch-pr/watch-pr wait <number or URL>
```

Tell the user in two or three lines what you did since the last wake. Then end your turn. The command exits and wakes you:

- **Exit 0**: news. The output lists each item. Handle each item, push, and run `wait` again.
- **Exit 3**: the watch ended. The output says why. Report to the user and stop.
- **Other**: an error. Show the user the output and stop.

## Handle an item

Comment snippets are cut at 200 characters. Read the full text with the `github-pr` skill before you act.

- **Failed check.** Get the log with the `github-job` skill. Fix the cause, then run the same check locally before you push.
  A check can fail for a reason outside the pull request, such as a flaky job or an infrastructure problem.
  Then tell the user and change no code. A `cancelled` check is usually replaced by a newer push.
- **Required checks passed.** Tell the user. Keep watching for reviews.
- **Comment or review.** A comment marked `(you)` is from the user, and it is an instruction to you. For other comments, choose one:
  - It is correct: fix it, push, then reply with what you changed and the commit SHA. Resolve the thread.
  - It is unclear: reply with a question.
  - It is wrong or out of scope: reply with the reason, and leave the code as is.
  - It needs a decision from the user: ask the user in the session.
- **Behind or conflict.** The repository requires linear history, so the branch must be on top of its base to merge.
  If tracked files have uncommitted changes, stop and ask the user. They can be the user's other work.
  Else rebase at once: fetch, rebase onto `origin/<base branch>`, and resolve any conflicts.
  If you resolved conflicts, run the tests for the files you changed. Then push with `--force-with-lease`.
  If both sides changed the same logic and the right merge is not clear, stop and ask the user.

## Commit and push

The working tree can have the user's other work. Stage only the files you changed for the item.

Match the commit message style in `git log`. Use one commit for each fix. Push once for each wake, so that CI runs once.

Before you push changes under `backend/`, lint and test as the `backend` skill says.

## GitHub API budget

The script spends about 30 GraphQL points per hour on an active pull request. Your own `gh` calls use the same quota.
REST calls (`gh api repos/...`) have their own quota, so use them for reads and replies.
`gh pr view`, `gh pr checks`, and `gh api graphql` spend GraphQL points.

Reply to a review comment:

```bash
gh api repos/City-of-Helsinki/tilavarauspalvelu-core/pulls/<number>/comments/<comment id>/replies -F body=@<file>
```

Post a general comment:

```bash
gh pr comment <number> --body-file <file>
```

To resolve a thread, find its ID once with `reviewThreads(first: 100) { nodes { id isResolved comments(first: 1) { nodes { databaseId } } } }`.
Then run the `resolveReviewThread` mutation with `gh api graphql`.

## Stop the watch

The watch ends on its own in these cases:

- The pull request merges or closes.
- 10 wakes in a row bring only comments.
- Reading the pull request fails 8 times in a row.

If the user asks you to stop, stop the background task with the TaskStop tool. Then run:

```bash
.agents/skills/watch-pr/watch-pr stop <number or URL>
```
