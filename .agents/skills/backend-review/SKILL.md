---
name: backend-review
description: Use before reviewing backend code in backend/**.
---

The target for the review is determined in this order (first match wins):

1. Anything the user said when invoking the skill
2. Uncommitted changes (on the working tree or staging area)
3. Committed changes on this branch up to its merge base

If nothing matches, stop and ask the user what they want to review.

Code should follow the conventions as described in these docs:

- `.agents/docs/backend-code-style.md`
- `.agents/docs/backend-architecture.md`
- `.agents/docs/backend-testing.md`

Flag any inconsistency with the conventions, even if there is a precedent
for ignoring the convention in the codebase. The goal is to align the codebase
with the conventions, not to take shortcuts or follow bad practices from the past.

Number each finding (`#1`, `#2`, `#3`, ...). Do not use sub-headings like `1.1.` or `1.a.`.
State one issue per finding. Link to file and line when the finding applies to a specific location.
Order findings by importance, most important first. Do not add a summary at the end.
