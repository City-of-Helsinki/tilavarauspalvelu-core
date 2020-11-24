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
