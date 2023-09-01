from datetime import timedelta
from typing import NamedTuple

import pytest
from django.utils import timezone
from freezegun import freeze_time

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from tests.factories import BannerNotificationFactory, UserFactory
from tests.helpers import load_content, parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class OrderingParams(NamedTuple):
    order_by: str
    expected: list[dict[str, dict[str, str]]]


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="state",
                expected=[
                    {"node": {"message": "2", "state": "ACTIVE"}},
                    {"node": {"message": "3", "state": "SCHEDULED"}},
                    {"node": {"message": "1", "state": "DRAFT"}},
                    {"node": {"message": "4", "state": "DRAFT"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="-state",
                expected=[
                    {"node": {"message": "4", "state": "DRAFT"}},
                    {"node": {"message": "1", "state": "DRAFT"}},
                    {"node": {"message": "3", "state": "SCHEDULED"}},
                    {"node": {"message": "2", "state": "ACTIVE"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_state(graphql, order_by, expected):
    # given:
    # - There are banner notification of all different states in the system
    # - Notification manager user is using the system
    BannerNotificationFactory.create(
        message="1",
        draft=True,
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create_active(
        message="2",
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create_scheduled(
        message="3",
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create_past(
        message="4",
        target=BannerNotificationTarget.ALL,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    response = graphql(
        """
        query {
          bannerNotifications(orderBy: "%s") {
            edges {
              node {
                message
                state
              }
            }
          }
        }
        """
        % (order_by,),
    )

    # then:
    # - The response contains the notifications in the expected order
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="name",
                expected=[
                    {"node": {"message": "2", "name": "bar"}},
                    {"node": {"message": "1", "name": "foo"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="-name",
                expected=[
                    {"node": {"message": "1", "name": "foo"}},
                    {"node": {"message": "2", "name": "bar"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_name(graphql, order_by, expected):
    # given:
    # - There are two banner notification with different names in the system
    # - Notification manager user is using the system
    BannerNotificationFactory.create_active(
        name="foo",
        message="1",
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create_active(
        name="bar",
        message="2",
        target=BannerNotificationTarget.ALL,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    response = graphql(
        """
        query {
          bannerNotifications(orderBy: "%s") {
            edges {
              node {
                message
                name
              }
            }
          }
        }
        """
        % (order_by,),
    )

    # then:
    # - The response contains the notifications in the expected order
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="starts",
                expected=[
                    {"node": {"message": "2", "activeFrom": "2023-01-30T00:00:00+00:00"}},
                    {"node": {"message": "1", "activeFrom": "2023-01-31T00:00:00+00:00"}},
                    {"node": {"message": "3", "activeFrom": None}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="-starts",
                expected=[
                    {"node": {"message": "3", "activeFrom": None}},
                    {"node": {"message": "1", "activeFrom": "2023-01-31T00:00:00+00:00"}},
                    {"node": {"message": "2", "activeFrom": "2023-01-30T00:00:00+00:00"}},
                ],
            ),
        },
    )
)
@freeze_time("2023-02-01", tz_offset=0)
def test_sort_banner_notifications_by_start_date(graphql, order_by, expected):
    # given:
    # - There are two banner notification with different start dates & and one without one
    # - Notification manager user is using the system
    today = timezone.now()
    BannerNotificationFactory.create_active(
        message="1",
        target=BannerNotificationTarget.ALL,
        active_from=today - timedelta(days=1),
    )
    BannerNotificationFactory.create_active(
        message="2",
        target=BannerNotificationTarget.ALL,
        active_from=today - timedelta(days=2),
    )
    BannerNotificationFactory.create(
        message="3",
        target=BannerNotificationTarget.ALL,
        draft=True,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    response = graphql(
        """
        query {
          bannerNotifications(orderBy: "%s") {
            edges {
              node {
                message
                activeFrom
              }
            }
          }
        }
        """
        % (order_by,),
    )

    # then:
    # - The response contains the notifications in the expected order
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="ends",
                expected=[
                    {"node": {"message": "1", "activeUntil": "2023-02-02T00:00:00+00:00"}},
                    {"node": {"message": "2", "activeUntil": "2023-02-03T00:00:00+00:00"}},
                    {"node": {"message": "3", "activeUntil": None}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="-ends",
                expected=[
                    {"node": {"message": "3", "activeUntil": None}},
                    {"node": {"message": "2", "activeUntil": "2023-02-03T00:00:00+00:00"}},
                    {"node": {"message": "1", "activeUntil": "2023-02-02T00:00:00+00:00"}},
                ],
            ),
        },
    )
)
@freeze_time("2023-02-01", tz_offset=0)
def test_sort_banner_notifications_by_end_date(graphql, order_by, expected):
    # given:
    # - There are two banner notification with different end dates & and one without one
    # - Notification manager user is using the system
    today = timezone.now()
    BannerNotificationFactory.create_active(
        message="1",
        target=BannerNotificationTarget.ALL,
        active_until=today + timedelta(days=1),
    )
    BannerNotificationFactory.create_active(
        message="2",
        target=BannerNotificationTarget.ALL,
        active_until=today + timedelta(days=2),
    )
    BannerNotificationFactory.create(
        message="3",
        target=BannerNotificationTarget.ALL,
        draft=True,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    response = graphql(
        """
        query {
          bannerNotifications(orderBy: "%s") {
            edges {
              node {
                message
                activeUntil
              }
            }
          }
        }
        """
        % (order_by,),
    )

    # then:
    # - The response contains the notifications in the expected order
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="target",
                expected=[
                    {"node": {"message": "1", "target": "ALL"}},
                    {"node": {"message": "2", "target": "USER"}},
                    {"node": {"message": "3", "target": "STAFF"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="-target",
                expected=[
                    {"node": {"message": "3", "target": "STAFF"}},
                    {"node": {"message": "2", "target": "USER"}},
                    {"node": {"message": "1", "target": "ALL"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_target(graphql, order_by, expected):
    # given:
    # - There are banner notification for all target audiences in the system
    # - Notification manager user is using the system
    BannerNotificationFactory.create_active(
        message="1",
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create_active(
        message="2",
        target=BannerNotificationTarget.USER,
    )
    BannerNotificationFactory.create_active(
        message="3",
        target=BannerNotificationTarget.STAFF,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    response = graphql(
        """
        query {
          bannerNotifications(orderBy: "%s") {
            edges {
              node {
                message
                target
              }
            }
          }
        }
        """
        % (order_by,),
    )

    # then:
    # - The response contains the notifications in the expected order
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="level",
                expected=[
                    {"node": {"message": "3", "level": "EXCEPTION"}},
                    {"node": {"message": "2", "level": "WARNING"}},
                    {"node": {"message": "1", "level": "NORMAL"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="-level",
                expected=[
                    {"node": {"message": "1", "level": "NORMAL"}},
                    {"node": {"message": "2", "level": "WARNING"}},
                    {"node": {"message": "3", "level": "EXCEPTION"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_level(graphql, order_by, expected):
    # given:
    # - There are banner notification for all types in the system
    # - Notification manager user is using the system
    BannerNotificationFactory.create_active(
        message="1",
        level=BannerNotificationLevel.NORMAL,
    )
    BannerNotificationFactory.create_active(
        message="2",
        level=BannerNotificationLevel.WARNING,
    )
    BannerNotificationFactory.create_active(
        message="3",
        level=BannerNotificationLevel.EXCEPTION,
    )
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    response = graphql(
        """
        query {
          bannerNotifications(orderBy: "%s") {
            edges {
              node {
                message
                level
              }
            }
          }
        }
        """
        % (order_by,),
    )

    # then:
    # - The response contains the notifications in the expected order
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected
