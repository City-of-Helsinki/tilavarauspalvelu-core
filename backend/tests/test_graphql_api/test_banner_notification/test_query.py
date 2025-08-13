from __future__ import annotations

import datetime
from typing import Any, NamedTuple

import pytest
from undine.relay import to_global_id

from tilavarauspalvelu.api.graphql.types.banner_notification.queries import BannerNotificationNode
from tilavarauspalvelu.enums import BannerNotificationTarget
from utils.date_utils import local_datetime

from tests.factories import BannerNotificationFactory, UserFactory
from tests.factories.banner_notification import BannerNotificationBuilder
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class FilteringParams(NamedTuple):
    value: Any
    expected: Any


def test_filter_banner_notifications_by_name(graphql):
    # given:
    # - There are two banner notifications in the system
    # - Notification manager user is using the system
    BannerNotificationFactory.create(name="foo")
    BannerNotificationFactory.create(name="bar")
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications with the given name
    query = """
        query {
            bannerNotifications(filter: {name: "foo"}) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
    """
    response = graphql(query)

    # then:
    # - The response contains only the expected banner notification
    assert len(response.edges) == 1, response
    assert response.node(0) == {"name": "foo"}, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "All": FilteringParams(
                value=BannerNotificationTarget.ALL,
                expected={"name": "baz"},
            ),
            "Staff": FilteringParams(
                value=BannerNotificationTarget.STAFF,
                expected={"name": "bar"},
            ),
            "User": FilteringParams(
                value=BannerNotificationTarget.USER,
                expected={"name": "foo"},
            ),
        },
    )
)
def test_filter_banner_notifications_by_target(graphql, value, expected):
    # given:
    # - There are three banner notifications in the system, one each target
    # - Notification manager user is using the system
    BannerNotificationFactory.create(name="foo", target=BannerNotificationTarget.USER)
    BannerNotificationFactory.create(name="bar", target=BannerNotificationTarget.STAFF)
    BannerNotificationFactory.create(name="baz", target=BannerNotificationTarget.ALL)
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications filtered by is_active
    query = """
        query ($target: BannerNotificationTarget!) {
            bannerNotifications(filter: {target: $target}) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
    """
    response = graphql(query, variables={"target": value})

    # then:
    # - The response contains only the expected banner notifications
    assert len(response.edges) == 1, response
    assert response.node(0) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active": FilteringParams(
                value=True,
                expected={"name": "bar"},
            ),
            "Inactive": FilteringParams(
                value=False,
                expected={"name": "foo"},
            ),
        },
    )
)
def test_filter_banner_notifications_by_is_active(graphql, value, expected):
    # given:
    # - There are two banner notifications in the system, one active and one inactive
    # - Notification manager user is using the system
    now = local_datetime()

    BannerNotificationFactory.create(  # inactive
        name="foo",
        draft=True,
    )
    BannerNotificationFactory.create(  # active
        name="bar",
        draft=False,
        active_from=now - datetime.timedelta(days=1),
        active_until=now + datetime.timedelta(days=1),
    )

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications filtered by is_active
    query = """
        query BannerNotifications($isActive: Boolean!) {
            bannerNotifications(filter: {isActive: $isActive}) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
    """
    response = graphql(query, variables={"isActive": value})

    # then:
    # - The response contains only the expected banner notifications
    assert len(response.edges) == 1, response
    assert response.node(0) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Visible": FilteringParams(
                value=True,
                expected=[
                    {"node": {"name": "foo"}},
                    {"node": {"name": "bar"}},
                    {"node": {"name": "baz"}},
                ],
            ),
            "Hidden": FilteringParams(
                value=False,
                expected=[
                    {"node": {"name": "1"}},
                    {"node": {"name": "2"}},
                    {"node": {"name": "3"}},
                ],
            ),
        },
    )
)
def test_filter_banner_notifications_by_is_visible(graphql, value, expected):
    # given:
    # - There are six banner notifications in the system, one for each target in active and inactive state
    # - Notification manager user is using the system
    BannerNotificationBuilder().active().create(name="foo", target=BannerNotificationTarget.USER)
    BannerNotificationBuilder().active().create(name="bar", target=BannerNotificationTarget.STAFF)
    BannerNotificationBuilder().active().create(name="baz", target=BannerNotificationTarget.ALL)
    BannerNotificationFactory.create(name="1", target=BannerNotificationTarget.USER)
    BannerNotificationFactory.create(name="2", target=BannerNotificationTarget.STAFF)
    BannerNotificationFactory.create(name="3", target=BannerNotificationTarget.ALL)
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications filtered by is_active
    query = """
        query BannerNotifications($isVisible: Boolean!) {
            bannerNotifications(filter: {isVisible: $isVisible}, orderBy: pkAsc) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
    """
    response = graphql(query, variables={"isVisible": value})

    # then:
    # - The response contains only the expected banner notifications
    assert response.edges == expected, response


def test_fetch_single_banner_notification_by_id(graphql):
    # given:
    # - There are two banner notifications in the system
    # - Notification manager user is using the system
    notification_1 = BannerNotificationFactory.create(name="foo")
    BannerNotificationFactory.create(name="bar")

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    global_id = to_global_id(BannerNotificationNode.__name__, notification_1.pk)

    # when:
    # - The user requests a banner notification with the given id
    query = """
        query ($id: ID!) {
            node(id: $id) {
                ... on BannerNotificationNode {
                    name
                }
            }
        }
    """
    response = graphql(query, variables={"id": global_id})

    # then:
    # - The response contains the expected banner notification
    assert response.results == {"name": "foo"}, response
