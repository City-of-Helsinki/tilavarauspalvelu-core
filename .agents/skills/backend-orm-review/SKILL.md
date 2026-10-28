---
name: backend-orm-review
description: Use before reviewing Django ORM usage in backend/**, such as queries, bulk writes, GraphQL optimization, migrations, and test data.
---

Read the rules in `.agents/docs/backend-orm.md`.

## Steps

1. Find the target. If `backend-review` called this skill, use its target.
   Otherwise, use the same order as `backend-review`: what the user said, then uncommitted changes,
   then committed changes on this branch up to its merge base.
2. Trace every call. For each changed line that can reach the database, follow each call into our code
   (`tilavarauspalvelu/` and `utils/`). This includes methods, properties, lookup properties,
   `actions`, `validators`, serializers, permission checks, and signal receivers in `tilavarauspalvelu/signals.py`.
   The step is done when every call path ends in a known query or in code that does not touch the database.
3. Measure. When a finding depends on the number of queries, write a throwaway test and run it.
   See `Throwaway tests`. Delete the test file when you have the numbers.
4. Report. Apply every rule in `.agents/docs/backend-orm.md` to the target. Number each finding (`#1`, `#2`, `#3`, ...).
   State one issue per finding. Link to the file and line. Order findings by importance, most important first.
   Give the measured query count when you have one. If `backend-review` called this skill,
   add the findings to its list instead.

## Throwaway tests

- Put the test in `tests/test_orm_review_tmp.py`. Run only that file with `poetry run pytest`.
- Count queries with the `query_counter` fixture (`len(counter.queries)`, `counter.log`).
  For GraphQL, use `len(response.queries)` and `response.query_log`.
- To find an N+1, run the same code with 2 rows and then with 3 rows.
  If the count grows with the rows, the code makes queries in a loop.
- When a hot path has a fixed query count, suggest a real test that asserts it with `response.assert_query_count()`.
  Admin pages have `tests/test_admin/test_admin_query_counts.py` for this.
