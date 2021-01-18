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

- We want to easily determine if related field contains id or whole object. Always use `_id` at end of the field name if it is a foreign key id field.
- If related models are exposed in their own API endpoint, use it to CRUD them. Use nested objects only if they are not used separately.
- Check examples in `api/examples.py` for samples how to do different implementations using above rules.

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

## OpenAPI documentation
To improve automatic OpenAPI schema introspection, we obey the following principles.

- API endpoint groups, or `tags` in OpenAPI jargon, are given a description in `settings.SPECTACULAR_SETTINGS['TAGS']`.
- `ModelSerializer`'s model fields defined in `Meta.fields` are given a description using `help_text` via `extra_kwargs`.
  ```python
  class Meta:
      extra_kwargs = {
          "field_name": {
              "help_text": "Field description.",
          }
      }
  ```
- Non-model fields are given a description using `help_text` kwarg on the field.
  ```python
  field_name = serializers.SerializerMethodField(help_text="Field description.")
  ```
- Filters are given a description using `help_text` kwarg on the filter.
  ```python
  filter_name = filters.NumberFilter(help_text="Filter description.")
  ```
- ViewSets are given a description either by giving the class a docstring or by using the `extend_schema` decorator on the class.
  ```python
  @extend_schema(description="ViewSet description.")
  ```
  `extend_schema` overrides docstring, if both are used.
- View specific descriptions within a ViewSet can be given using the `extend_schema_view` decorator on the ViewSet class.
  ```python
  @extend_schema_view(
      list=extend_schema(description="list description."),
      create=extend_schema(description="create description."),
  )
  ```
  View specific descriptions override ViewSet description.
- `SerializerMethodField`s are given a type using type hinting.
  ```python
  max_persons = serializers.SerializerMethodField()

  def get_max_persons(self, reservation_unit) -> int:
      return reservation_unit.get_max_persons()
  ```