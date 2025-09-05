from __future__ import annotations

import datetime
from typing import NamedTuple

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget
from utils.date_utils import local_datetime

from tests.factories import BannerNotificationFactory, UserFactory
from tests.factories.banner_notification import BannerNotificationBuilder
from tests.helpers import parametrize_helper

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
                order_by="stateAsc",
                expected=[
                    {"node": {"messageFi": "active", "state": "ACTIVE"}},
                    {"node": {"messageFi": "scheduled", "state": "SCHEDULED"}},
                    {"node": {"messageFi": "draft", "state": "DRAFT"}},
                    {"node": {"messageFi": "past", "state": "DRAFT"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="stateDesc",
                expected=[
                    {"node": {"messageFi": "past", "state": "DRAFT"}},
                    {"node": {"messageFi": "draft", "state": "DRAFT"}},
                    {"node": {"messageFi": "scheduled", "state": "SCHEDULED"}},
                    {"node": {"messageFi": "active", "state": "ACTIVE"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_state(graphql, order_by, expected):
    # given:
    # - There are banner notification of all different states in the system
    # - Notification manager user is using the system
    now = local_datetime()

    BannerNotificationFactory.create(
        message="draft",
        draft=True,
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create(
        message="active",
        draft=False,
        active_from=now - datetime.timedelta(days=1),
        active_until=now + datetime.timedelta(days=1),
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create(
        message="scheduled",
        draft=False,
        active_from=now + datetime.timedelta(days=1),
        active_until=now + datetime.timedelta(days=2),
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationFactory.create(
        message="past",
        draft=False,
        active_from=now - datetime.timedelta(days=2),
        active_until=now - datetime.timedelta(days=1),
        target=BannerNotificationTarget.ALL,
    )

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    query = """
        query {
          bannerNotifications(orderBy: %s) {
            edges {
              node {
                messageFi
                state
              }
            }
          }
        }
    """
    response = graphql(query % order_by)

    # then:
    # - The response contains the notifications in the expected order
    assert response.edges == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="nameAsc",
                expected=[
                    {"node": {"messageFi": "2", "name": "bar"}},
                    {"node": {"messageFi": "1", "name": "foo"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="nameDesc",
                expected=[
                    {"node": {"messageFi": "1", "name": "foo"}},
                    {"node": {"messageFi": "2", "name": "bar"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_name(graphql, order_by, expected):
    # given:
    # - There are two banner notification with different names in the system
    # - Notification manager user is using the system
    BannerNotificationBuilder().active().create(
        name="foo",
        message="1",
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationBuilder().active().create(
        name="bar",
        message="2",
        target=BannerNotificationTarget.ALL,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    query = """
        query {
          bannerNotifications(orderBy: %s) {
            edges {
              node {
                messageFi
                name
              }
            }
          }
        }
    """
    response = graphql(query % order_by)

    # then:
    # - The response contains the notifications in the expected order
    assert response.edges == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="startsAsc",
                expected=[
                    {"node": {"messageFi": "2", "activeFrom": "2023-01-30T00:00:00+00:00"}},
                    {"node": {"messageFi": "1", "activeFrom": "2023-01-31T00:00:00+00:00"}},
                    {"node": {"messageFi": "3", "activeFrom": None}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="startsDesc",
                expected=[
                    {"node": {"messageFi": "3", "activeFrom": None}},
                    {"node": {"messageFi": "1", "activeFrom": "2023-01-31T00:00:00+00:00"}},
                    {"node": {"messageFi": "2", "activeFrom": "2023-01-30T00:00:00+00:00"}},
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
    today = local_datetime()
    BannerNotificationBuilder().active().create(
        message="1",
        target=BannerNotificationTarget.ALL,
        active_from=today - datetime.timedelta(days=1),
    )
    BannerNotificationBuilder().active().create(
        message="2",
        target=BannerNotificationTarget.ALL,
        active_from=today - datetime.timedelta(days=2),
    )
    BannerNotificationFactory.create(
        message="3",
        target=BannerNotificationTarget.ALL,
        draft=True,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    query = """
        query {
          bannerNotifications(orderBy: %s) {
            edges {
              node {
                messageFi
                activeFrom
              }
            }
          }
        }
    """
    response = graphql(query % order_by)

    # then:
    # - The response contains the notifications in the expected order
    assert response.edges == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="endsAsc",
                expected=[
                    {"node": {"messageFi": "1", "activeUntil": "2023-02-02T00:00:00+00:00"}},
                    {"node": {"messageFi": "2", "activeUntil": "2023-02-03T00:00:00+00:00"}},
                    {"node": {"messageFi": "3", "activeUntil": None}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="endsDesc",
                expected=[
                    {"node": {"messageFi": "3", "activeUntil": None}},
                    {"node": {"messageFi": "2", "activeUntil": "2023-02-03T00:00:00+00:00"}},
                    {"node": {"messageFi": "1", "activeUntil": "2023-02-02T00:00:00+00:00"}},
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
    today = local_datetime()
    BannerNotificationBuilder().active().create(
        message="1",
        target=BannerNotificationTarget.ALL,
        active_until=today + datetime.timedelta(days=1),
    )
    BannerNotificationBuilder().active().create(
        message="2",
        target=BannerNotificationTarget.ALL,
        active_until=today + datetime.timedelta(days=2),
    )
    BannerNotificationFactory.create(
        message="3",
        target=BannerNotificationTarget.ALL,
        draft=True,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    query = """
        query {
          bannerNotifications(orderBy: %s) {
            edges {
              node {
                messageFi
                activeUntil
              }
            }
          }
        }
    """
    response = graphql(query % order_by)

    # then:
    # - The response contains the notifications in the expected order
    assert response.edges == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="targetAsc",
                expected=[
                    {"node": {"messageFi": "1", "target": "ALL"}},
                    {"node": {"messageFi": "2", "target": "USER"}},
                    {"node": {"messageFi": "3", "target": "STAFF"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="targetDesc",
                expected=[
                    {"node": {"messageFi": "3", "target": "STAFF"}},
                    {"node": {"messageFi": "2", "target": "USER"}},
                    {"node": {"messageFi": "1", "target": "ALL"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_target(graphql, order_by, expected):
    # given:
    # - There are banner notification for all target audiences in the system
    # - Notification manager user is using the system
    BannerNotificationBuilder().active().create(
        message="1",
        target=BannerNotificationTarget.ALL,
    )
    BannerNotificationBuilder().active().create(
        message="2",
        target=BannerNotificationTarget.USER,
    )
    BannerNotificationBuilder().active().create(
        message="3",
        target=BannerNotificationTarget.STAFF,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    query = """
        query {
          bannerNotifications(orderBy: %s) {
            edges {
              node {
                messageFi
                target
              }
            }
          }
        }
    """
    response = graphql(query % order_by)

    # then:
    # - The response contains the notifications in the expected order
    assert response.edges == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Ascending order": OrderingParams(
                order_by="levelAsc",
                expected=[
                    {"node": {"messageFi": "3", "level": "EXCEPTION"}},
                    {"node": {"messageFi": "2", "level": "WARNING"}},
                    {"node": {"messageFi": "1", "level": "NORMAL"}},
                ],
            ),
            "Descending order": OrderingParams(
                order_by="levelDesc",
                expected=[
                    {"node": {"messageFi": "1", "level": "NORMAL"}},
                    {"node": {"messageFi": "2", "level": "WARNING"}},
                    {"node": {"messageFi": "3", "level": "EXCEPTION"}},
                ],
            ),
        },
    )
)
def test_sort_banner_notifications_by_level(graphql, order_by, expected):
    # given:
    # - There are banner notification for all types in the system
    # - Notification manager user is using the system
    BannerNotificationBuilder().active().create(
        message="1",
        level=BannerNotificationLevel.NORMAL,
    )
    BannerNotificationBuilder().active().create(
        message="2",
        level=BannerNotificationLevel.WARNING,
    )
    BannerNotificationBuilder().active().create(
        message="3",
        level=BannerNotificationLevel.EXCEPTION,
    )
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User requests all banner notifications in the given order
    query = """
        query {
          bannerNotifications(orderBy: %s) {
            edges {
              node {
                messageFi
                level
              }
            }
          }
        }
    """
    response = graphql(query % order_by)

    # then:
    # - The response contains the notifications in the expected order
    assert response.edges == expected, response
