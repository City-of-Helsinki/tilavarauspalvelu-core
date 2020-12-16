## Branches

Name your branches in format {jira_issue_code}/{short_description}. Eg. `TILA-74/api-specifications`

## Pull Request Process

1. Name your pull request in format {jira_issue_code} | {description_of_the_pr}. Eg. `TILA-74 | Api specifications`
2. Always use `develop` branch as base for feature branches. Code (`develop` branch) is merged to `master` only for before release.
3. Always write a description for your pull request unless the title already describes the PR unambiguously.
4. Select other active developers of the project as reviewers for your pull request. At least 1 approving review is required for a PR before merge.
5. After PR has been approved and CI-pipeline has passed it can be merged to develop by anyone.

## Serializers
To keep serializers consistent, we obey the following principles. These principles may change in future.

- By default, define relations in `fields = []` Meta attribute, which uses `PrimaryKeyRelatedField`.
- If you need to represent relations as nested objects, use `PresentablePrimaryKeyRelatedField`, which is from `drf-extra-fields` library. This represents relations as nested objects when reading, and uses foreign key when writing.
- Do not create nested writing operations

## Translations
We use `django-modeltranslation` to deal with translations. Use `TranslatedModelSerializer` located in `api/base.py` to automatically register translated fields in API. Note: You still need to register the original field, such as `fields = ["name"]`. This will automatically register translated fields `name_fi`, `name_en`, `name_sv`.

## Testing
To guarantee that software is working as it supposed to, we obey the following testing principles. These principles are based on [Helsinki Testing requirements](https://dev.hel.fi/testing-requirements).

- By default, everything should be tested. We use `pytest` for testing.
- Single unit test should only cover a single feature/function/method. When a test breaks, it should be as obvious as possible to detect where the problem lies.
- Use clear and descriptive naming, such as `test_authenticated_user_can_make_reservation` or `test_order_cannot_be_modified`.
- Readability is important. Avoid loops in tests.
- Tests are located under their respective apps, for example tests for Space-models should be in `spaces/tests.py`. API-related tests are under `api` application, postfixed by related endpoint, such as `api/test_reservation_api.py`.
- Abstract reusable test data in fixtures (`conftest.py`). Sometimes creating or manipulating objects during a test is necessary, but if the data could be used in another test, put it in fixtures.

## Branches
Format your code with format.sh script to conform to style checks, and fix possible flake8 errors in your code. 