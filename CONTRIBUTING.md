## Branches

Name your branches in format {jira_issue_code}/{short_description}. Eg. `TILA-74/api-specifications`

## Pull Request Process

1. Name your pull request in format {jira_issue_code} | {description_of_the_pr}. Eg. `TILA-74 | Api specifications`
2. Always use `develop` branch as base for feature branches. Code (`develop` branch) is merged to `master` only for before release.
3. Always write a description for your pull request unless the title already describes the PR unambiguously.
4. Select other active developers of the project as reviewers for your pull request. At least 1 approving review is required for a PR before merge.
5. After PR has been approved and CI-pipeline has passed it can be merged to develop by anyone.

## Unit tests

- By default, everything should be unit tested. We use `pytest` for unit testing.
- Single unit test should only cover a single feature/function/method. When a test breaks, it should be as obvious as possible to detect where the problem lies.
- Use clear and descriptive naming, such as `test_authenticated_user_can_make_reservation` or `test_order_cannot_be_modified`.
- Readability is important. Avoid loops in unit tests.
- Abstract reusable test data in fixtures (`conftest.py`). Sometimes creating or manipulating objects during a test is necessary, but if the data could be used in another test, put it in fixtures.