from __future__ import annotations

import datetime
from typing import NamedTuple

import pytest

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget
from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from tests.factories import BannerNotificationFactory, UserFactory
from tests.helpers import parametrize_helper

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class InvalidActiveParams(NamedTuple):
    active_from: str | None
    active_until: str | None
    error_messages: list[str]


def test_user_updates_draft_banner_notification(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "pk": notification.pk,
        "name": "1",
        "messageFi": "2",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    # when:
    # - User tries to modify the banner notification
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response has no errors
    # - The banner notification has been updated
    assert response.has_errors is False

    notification.refresh_from_db()
    assert notification.name == "1"
    assert notification.message == "2"
    assert notification.target == BannerNotificationTarget.ALL.value
    assert notification.level == BannerNotificationLevel.NORMAL.value


def test_user_publishes_draft_banner_notification(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    active_from = datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC)
    active_until = datetime.datetime(2020, 1, 2, tzinfo=datetime.UTC)

    input_data = {
        "pk": notification.pk,
        "draft": False,
        "activeFrom": active_from.isoformat(),
        "activeUntil": active_until.isoformat(),
    }

    # when:
    # - User tries to 'publish' the banner notification
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response has no errors
    # - The banner notification has been updated
    assert response.has_errors is False

    notification.refresh_from_db()
    assert notification.draft is False
    assert notification.active_from == active_from
    assert notification.active_until == active_until


def test_user_tries_to_publish_draft_banner_notification_without_setting_active_period(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "pk": notification.pk,
        "draft": False,
    }

    # when:
    # - User tries to 'publish' the banner notification
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response contains errors about missing active period
    assert response.error_message(0) == "Non-draft notifications must set 'activeFrom'"


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active from before active until": InvalidActiveParams(
                active_from="2022-01-02T00:00:00",
                active_until="2022-01-01T00:00:00",
                error_messages=[
                    "'activeFrom' must be before 'activeUntil'.",
                ],
            ),
            "Must set 'activeUntil' if 'activeFrom' is set": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until=None,
                error_messages=[
                    "Both 'activeFrom' and 'activeUntil' must be either set or null.",
                    "Non-draft notifications must set 'activeUntil'",
                ],
            ),
            "Must set 'activeFrom' if 'activeUntil' is set": InvalidActiveParams(
                active_from=None,
                active_until="2022-01-01T00:00:00",
                error_messages=[
                    "Both 'activeFrom' and 'activeUntil' must be either set or null.",
                    "Non-draft notifications must set 'activeFrom'",
                ],
            ),
            "Active from same active until": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until="2022-01-01T00:00:00",
                error_messages=[
                    "'activeFrom' must be before 'activeUntil'.",
                ],
            ),
        },
    ),
)
def test_user_tries_to_publish_draft_banner_notification_with_improper_active_period(
    graphql, active_from, active_until, error_messages
):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "pk": notification.pk,
        "draft": False,
        "activeFrom": active_from,
        "activeUntil": active_until,
    }

    # when:
    # - User tries to modify the banner notification
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response contains errors about the improper active period
    for i, error_message in enumerate(error_messages):
        assert response.error_message(i) == error_message, response


def test_primary_key_is_required_for_updating(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    BannerNotificationFactory.create(
        name="foo",
        draft=True,
        target=BannerNotificationTarget.USER.value,
        level=BannerNotificationLevel.EXCEPTION.value,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {}

    # when:
    # - User tries to modify the banner notification
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response complains about the improper input
    assert response.error_message(0).startswith("Variable '$input'")


def test_user_updates_non_existing_banner_notification(graphql):
    # given:
    # - There are no banner notifications in the system
    # - Notification manager is using the system
    assert BannerNotification.objects.count() == 0
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    input_data = {
        "pk": 1,
        "name": "1",
        "messageFi": "2",
        "target": BannerNotificationTarget.ALL.value,
        "level": BannerNotificationLevel.NORMAL.value,
    }

    # when:
    # - User tries to modify a non-existing banner notification
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response contains an error about non-existing banner notification
    assert response.error_message(0) == (
        "Primary key 1 on model 'tilavarauspalvelu.models.banner_notification.model.BannerNotification' "
        "did not match any row."
    )
