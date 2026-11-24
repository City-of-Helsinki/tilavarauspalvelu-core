---
name: code-review
description: >-
  Review a pull request, a branch or the current changes for bugs and for the project conventions.
  Use when the user asks to review code or a pull request, for example "review PR 2960".
argument-hint: "[PR number or URL, branch, or path]"
---

## 1. Find the target

Ignore an effort level in the arguments, such as `low`, `high` or `max`. The review is the same for all levels.
The target is the first match in this list:

1. A pull request number or URL from the user. Use the `github-pr` skill:
   - Run `github-pr` to get the description and the review comments that exist.
   - Run `github-pr-fetch` to get the code. Read the code from the refs that it prints. Do not check out the branch.
2. A branch, a commit range or a path from the user. Compare a branch with its merge base on `main`.
3. Uncommitted changes, in the working tree or the staging area.
4. Committed changes on the current branch, up to its merge base on `main`.

If nothing matches, stop and ask the user what to review.

## 2. Review by area

Split the changed files by area. Do each step that has files.

- **All files.** Look for correctness bugs. See `Correctness`.
- **`backend/`.** Invoke the `backend-review` skill with the same target.
  It also invokes `backend-orm-review`. For a pull request, give it the `merge_base` and `head_ref`
  from `github-pr-fetch`. Do not write throwaway tests for a pull request,
  because the code that runs is not the code of the pull request. Write "not measured" on such a finding.
- **`frontend/`.** The project has no frontend review rules yet. Look only for correctness bugs.
  Read `.agents/docs/frontend-architecture.md` if you need to understand the code.

Read the full changed files, not only the diff, and the code that the changes call.
For a pull request, read the files with `git show <head_ref>:<path>`.

## Correctness

Correctness matters more than performance in this project. Look hardest at these areas:

- Payments and the payment state. A wrong state can cause a reclamation.
- Double bookings, and races where many users compete for the same slot.
- Access codes.
- Personal data. It must not leak into logs, errors or responses for other users.
- Permissions. A user must not see or change data that they do not have access to.
- Dates and times. The service uses Helsinki time. See `.agents/docs/backend-datetime.md` for the backend.
- The GraphQL schema `tilavaraus.graphql` and the frontend queries must match.

Flag only real problems. For each bug, give the input or state that causes it and the wrong result.
Do not repeat a problem that a review comment on the pull request already found.

## 3. Report

Put the findings from all steps in one list.
Number each finding (`#1`, `#2`, `#3`, ...). Do not use sub-headings like `1.1.` or `1.a.`.
State one issue per finding. Link to the file and line when the finding applies to a specific location.
Order findings by importance, most important first. Bugs come before conventions. Do not add a summary at the end.

Do not post anything to GitHub unless the user asks for it.
