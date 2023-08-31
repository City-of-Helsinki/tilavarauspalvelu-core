from typing import Any, NamedTuple

import pytest

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from tests.factories.user import UserFactory
from tests.helpers import load_content, parametrize_helper

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
        variables={
            "input": {
                "name": "foo",
                "message": "bar",
                "target": BannerNotificationTarget.ALL.value,
                "level": BannerNotificationLevel.NORMAL.value,
            }
        },
    )

    # then:
    # - The response contains the created notification
    content = load_content(response.content)
    assert content == {
        "data": {
            "createBannerNotification": {
                "name": "foo",
                "message": "bar",
                "errors": None,
            },
        },
    }


def test_user_creates_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(MUTATION_QUERY, variables={"input": {}})

    # then:
    # - The response complains about the missing fields
    content = load_content(response.content)
    assert content == {
        "errors": [
            {
                "locations": [{"column": 15, "line": 2}],
                "message": (
                    "Variable '$input' got invalid value {}; "
                    "Field 'level' of required type 'level!' was not provided."
                ),
            },
            {
                "locations": [{"column": 15, "line": 2}],
                "message": (
                    "Variable '$input' got invalid value {}; "
                    "Field 'name' of required type 'String!' was not provided."
                ),
            },
            {
                "locations": [{"column": 15, "line": 2}],
                "message": (
                    "Variable '$input' got invalid value {}; "
                    "Field 'target' of required type 'target!' was not provided."
                ),
            },
        ]
    }


def test_user_creates_non_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(
        MUTATION_QUERY,
        variables={
            "input": {
                "name": "foo",
                "target": BannerNotificationTarget.ALL.value,
                "level": BannerNotificationLevel.NORMAL.value,
                "draft": False,
            }
        },
    )

    # then:
    # - The response complains about the missing fields
    content = load_content(response.content)
    assert content == {
        "data": {
            "createBannerNotification": {
                "errors": [
                    {
                        "field": "activeFrom",
                        "messages": [
                            "Non-draft notifications must set 'active_from'",
                        ],
                    },
                    {
                        "field": "activeUntil",
                        "messages": [
                            "Non-draft notifications must set 'active_until'",
                        ],
                    },
                    {
                        "field": "message",
                        "messages": [
                            "Non-draft notifications must have a message.",
                        ],
                    },
                ],
                "message": None,
                "name": None,
            }
        }
    }


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
        variables={
            "input": {
                "name": "foo",
                "target": BannerNotificationTarget.ALL.value,
                "level": BannerNotificationLevel.NORMAL.value,
                "draft": True,
                "activeFrom": active_from,
                "activeUntil": active_until,
            }
        },
    )

    # then:
    # - The response complains about the 'active'-fields being invalid
    content = load_content(response.content)
    assert content == {
        "data": {
            "createBannerNotification": {
                "errors": expected,
                "message": None,
                "name": None,
            }
        }
    }
