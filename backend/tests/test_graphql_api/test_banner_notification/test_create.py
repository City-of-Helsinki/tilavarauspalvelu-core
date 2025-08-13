from __future__ import annotations

from typing import Any, NamedTuple

import pytest

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget
from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from tests.factories import UserFactory
from tests.helpers import parametrize_helper

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
    error_message: str


def test_user_creates_draft_banner_notification(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "messageFi": "bar",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    # when:
    # - User tries to create a new draft banner notification
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response has no errors
    # - The banner notification was created
    assert response.has_errors is False, response.errors
    assert BannerNotification.objects.filter(pk=response.results["pk"]).exists()


def test_user_creates_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {"name": "foo"}

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response complains about the improper input
    assert response.error_message(0).startswith("Variable '$input'")


def test_user_creates_non_draft_banner_notification_without_required_fields(graphql):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
        "draft": False,
    }

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response complains about the missing fields
    assert response.error_message(0) == "Non-draft notifications must have a message."
    assert response.error_message(1) == "Non-draft notifications must set 'activeFrom'"
    assert response.error_message(2) == "Non-draft notifications must set 'activeUntil'"


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active from before active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-01T00:00:00",
                error_message="'activeFrom' must be before 'activeUntil'.",
            ),
            "Must set 'active_until' if 'active_from' is set.": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until=None,
                error_message="Both 'activeFrom' and 'activeUntil' must be either set or null.",
            ),
            "Must set 'active_from' if 'active_until' is set.": InvalidActiveParams(
                active_from=None,
                active_until="2022-01-01T00:00:00",
                error_message="Both 'activeFrom' and 'activeUntil' must be either set or null.",
            ),
            "Active from same as active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-02T00:00:00",
                error_message="'activeFrom' must be before 'activeUntil'.",
            ),
        },
    ),
)
def test_user_creates_banner_notification_where_active_range_is_invalid(
    graphql, active_from, active_until, error_message
):
    # given:
    # - Notification manager is using the system
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "messageFi": "bar",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
        "draft": True,
        "activeFrom": active_from,
        "activeUntil": active_until,
    }

    # when:
    # - User tries to create a new banner notification with the given invalid data
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response has no errors
    # - The banner notification was created
    assert response.error_message(0) == error_message
