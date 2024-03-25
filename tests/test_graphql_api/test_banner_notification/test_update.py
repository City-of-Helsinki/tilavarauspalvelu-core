import datetime
from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing import parametrize_helper

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from common.models import BannerNotification
from tests.factories import BannerNotificationFactory, UserFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class InvalidActiveParams(NamedTuple):
    active_from: str | None
    active_until: str | None
    expected: Any


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
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify the banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

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
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    active_from = datetime.datetime(2020, 1, 1, tzinfo=datetime.UTC)
    active_until = datetime.datetime(2020, 1, 2, tzinfo=datetime.UTC)

    # when:
    # - User tries to 'publish' the banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "draft": False,
            "activeFrom": active_from.isoformat(),
            "activeUntil": active_until.isoformat(),
        },
    )

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
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to 'publish' the banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "draft": False,
        },
    )

    # then:
    # - The response contains errors about missing active period
    assert response.field_errors == [
        {
            "code": "invalid",
            "field": "activeFrom",
            "message": "Non-draft notifications must set 'active_from'",
        },
        {
            "code": "invalid",
            "field": "activeUntil",
            "message": "Non-draft notifications must set 'active_until'",
        },
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
                    },
                ],
            ),
            "Must set 'active_until' if 'active_from' is set": InvalidActiveParams(
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
                        "field": "activeUntil",
                        "message": "Non-draft notifications must set 'active_until'",
                    },
                    {
                        "code": "invalid",
                        "field": "activeFrom",
                        "message": "Both 'active_from' and 'active_until' must be either set or null.",
                    },
                ],
            ),
            "Must set 'active_from' if 'active_until' is set": InvalidActiveParams(
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
                    {
                        "code": "invalid",
                        "field": "activeFrom",
                        "message": "Non-draft notifications must set 'active_from'",
                    },
                ],
            ),
            "Active from same active until": InvalidActiveParams(
                active_from="2022-01-01T00:00:00",
                active_until="2022-01-01T00:00:00",
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
def test_user_tries_to_publish_draft_banner_notification_with_improper_active_period(
    graphql, active_from, active_until, expected
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
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify the banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "draft": False,
            "activeFrom": active_from,
            "activeUntil": active_until,
        },
    )

    # then:
    # - The response contains errors about the improper active period
    assert response.field_errors == expected, response


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
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify the banner notification
    response = graphql(UPDATE_MUTATION, input_data={})

    # then:
    # - The response complains about the improper input
    assert response.error_message().startswith("Variable '$input'")


def test_user_updates_non_existing_banner_notification(graphql):
    # given:
    # - There are no banner notifications in the system
    # - Notification manager is using the system
    assert BannerNotification.objects.count() == 0
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to modify a non-existing banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": 1,
            "name": "1",
            "message": "2",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response contains an error about non-existing banner notification
    assert response.error_message() == "`BannerNotification` object matching query `{'pk': 1}` does not exist."
