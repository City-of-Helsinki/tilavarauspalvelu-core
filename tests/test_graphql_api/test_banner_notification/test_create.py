from typing import Any, NamedTuple

import pytest

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from tests.factories import UserFactory
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class CreateParams(NamedTuple):
    data: dict[str, Any]
    expected: Any


class InvalidActiveParams(NamedTuple):
    active_from: str | None
    active_until: str | None
    expected: Any


MUTATION_QUERY = """
    mutation ($input: BannerNotificationCreateMutationInput!) {
      createBannerNotification(input: $input) {
        name
        message
        errors {
          field
          messages
        }
      }
    }
    """


def test_user_creates_draft_banner_notification(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new draft banner notification
    response = graphql(
        MUTATION_QUERY,
        input_data={
            "name": "foo",
            "message": "bar",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response contains the created notification
    assert response.first_query_object == {
        "name": "foo",
        "message": "bar",
        "errors": None,
    }, response


def test_user_creates_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(MUTATION_QUERY, input_data={})

    # then:
    # - The response complains about the improper input
    assert (
        response.error_message()
        == "Variable '$input' of required type 'BannerNotificationCreateMutationInput!' was not provided."
    )


def test_user_creates_non_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(
        MUTATION_QUERY,
        input_data={
            "name": "foo",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
            "draft": False,
        },
    )

    # then:
    # - The response complains about the missing fields
    assert response.field_error_messages("activeFrom") == ["Non-draft notifications must set 'active_from'"]
    assert response.field_error_messages("activeUntil") == ["Non-draft notifications must set 'active_until'"]
    assert response.field_error_messages("message") == ["Non-draft notifications must have a message."]


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active from before active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "field": "activeFrom",
                        "messages": [
                            "'active_from' must be before 'active_until'.",
                        ],
                    },
                ],
            ),
            "Must set 'active_until' if 'active_from' is set.": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until=None,
                expected=[
                    {
                        "field": "activeUntil",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                        ],
                    },
                    {
                        "field": "activeFrom",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                        ],
                    },
                ],
            ),
            "Must set 'active_from' if 'active_until' is set.": InvalidActiveParams(
                active_from=None,
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "field": "activeUntil",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                        ],
                    },
                    {
                        "field": "activeFrom",
                        "messages": [
                            "Both 'active_from' and 'active_until' must be either set or null.",
                        ],
                    },
                ],
            ),
            "Active from same as active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-02T00:00:00",
                expected=[
                    {
                        "field": "activeFrom",
                        "messages": [
                            "'active_from' must be before 'active_until'.",
                        ],
                    },
                ],
            ),
        },
    ),
)
def test_user_creates_banner_notification_where_active_range_is_invalid(graphql, active_from, active_until, expected):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(
        MUTATION_QUERY,
        input_data={
            "name": "foo",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
            "draft": True,
            "activeFrom": active_from,
            "activeUntil": active_until,
        },
    )

    # then:
    # - The response complains about the 'active'-fields being invali
    assert response.first_query_object == {
        "errors": expected,
        "message": None,
        "name": None,
    }, response
