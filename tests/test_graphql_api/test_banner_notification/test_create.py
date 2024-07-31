from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from common.enums import BannerNotificationLevel, BannerNotificationTarget
from common.models import BannerNotification
from tests.factories import UserFactory

from .helpers import CREATE_MUTATION

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


def test_user_creates_draft_banner_notification(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new draft banner notification
    response = graphql(
        CREATE_MUTATION,
        input_data={
            "name": "foo",
            "message": "bar",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response has no errors
    # - The banner notification was created
    assert response.has_errors is False, response.errors
    assert BannerNotification.objects.filter(pk=response.first_query_object["pk"]).exists()


def test_user_creates_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(
        CREATE_MUTATION,
        input_data={
            "name": "foo",
        },
    )

    # then:
    # - The response complains about the improper input
    assert response.error_message().startswith("Variable '$input'")


def test_user_creates_non_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(
        CREATE_MUTATION,
        input_data={
            "name": "foo",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
            "draft": False,
        },
    )

    # then:
    # - The response complains about the missing fields
    assert response.field_error_messages("activeFrom") == [
        "Non-draft notifications must set 'active_from'",
    ]
    assert response.field_error_messages("activeUntil") == ["Non-draft notifications must set 'active_until'"]
    assert response.field_error_messages("message") == [
        "Non-draft notifications must have a message.",
    ]


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active from before active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "code": "invalid",
                        "field": "activeFrom",
                        "message": "'active_from' must be before 'active_until'.",
                    }
                ],
            ),
            "Must set 'active_until' if 'active_from' is set.": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until=None,
                expected=[
                    {
                        "code": "invalid",
                        "field": "activeUntil",
                        "message": "Both 'active_from' and 'active_until' must be either set or null.",
                    },
                    {
                        "code": "invalid",
                        "field": "activeFrom",
                        "message": "Both 'active_from' and 'active_until' must be either set or null.",
                    },
                ],
            ),
            "Must set 'active_from' if 'active_until' is set.": InvalidActiveParams(
                active_from=None,
                active_until="2022-01-01T00:00:00",
                expected=[
                    {
                        "code": "invalid",
                        "field": "activeUntil",
                        "message": "Both 'active_from' and 'active_until' must be either set or null.",
                    },
                    {
                        "code": "invalid",
                        "field": "activeFrom",
                        "message": "Both 'active_from' and 'active_until' must be either set or null.",
                    },
                ],
            ),
            "Active from same as active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-02T00:00:00",
                expected=[
                    {
                        "code": "invalid",
                        "field": "activeFrom",
                        "message": "'active_from' must be before 'active_until'.",
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
        CREATE_MUTATION,
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
    # - The response has no errors
    # - The banner notification was created
    assert response.field_errors == expected
