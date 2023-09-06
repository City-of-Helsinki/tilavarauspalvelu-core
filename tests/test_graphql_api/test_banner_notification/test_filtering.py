from typing import Any, NamedTuple

import pytest

from common.choices import BannerNotificationTarget
from tests.factories import BannerNotificationFactory, UserFactory
from tests.helpers import load_content, parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class FilteringParams(NamedTuple):
    value: Any
    expected: list[dict]


def test_filter_banner_notifications_by_name(graphql):
    # given:
    # - There are two banner notifications in the system
    # - Notification manager user is using the system
    BannerNotificationFactory.create(name="foo")
    BannerNotificationFactory.create(name="bar")
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications with the given name
    response = graphql(
        """
        query {
            bannerNotifications(name: "foo") {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """,
    )

    # then:
    # - The response contains only the expected banner notification
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == [{"node": {"name": "foo"}}], content


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "All": FilteringParams(
                value=BannerNotificationTarget.ALL.value,
                expected=[
                    {"node": {"name": "baz"}},
                ],
            ),
            "Staff": FilteringParams(
                value=BannerNotificationTarget.STAFF.value,
                expected=[
                    {"node": {"name": "bar"}},
                ],
            ),
            "User": FilteringParams(
                value=BannerNotificationTarget.USER.value,
                expected=[
                    {"node": {"name": "foo"}},
                ],
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
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications filtered by is_active
    response = graphql(
        """
        query {
            bannerNotifications(target:%s) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """
        % (value,),
    )

    # then:
    # - The response contains only the expected banner notifications
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected, content


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Active": FilteringParams(
                value=True,
                expected=[
                    {"node": {"name": "bar"}},
                ],
            ),
            "Inactive": FilteringParams(
                value=False,
                expected=[
                    {"node": {"name": "foo"}},
                ],
            ),
        },
    )
)
def test_filter_banner_notifications_by_is_active(graphql, value, expected):
    # given:
    # - There are two banner notifications in the system, one active and one inactive
    # - Notification manager user is using the system
    BannerNotificationFactory.create(name="foo")
    BannerNotificationFactory.create_active(name="bar")
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications filtered by is_active
    response = graphql(
        """
        query BannerNotifications($isActive: Boolean!) {
            bannerNotifications(isActive: $isActive) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """,
        variables={"isActive": value},
    )

    # then:
    # - The response contains only the expected banner notifications
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected, content


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
    BannerNotificationFactory.create_active(name="foo", target=BannerNotificationTarget.USER)
    BannerNotificationFactory.create_active(name="bar", target=BannerNotificationTarget.STAFF)
    BannerNotificationFactory.create_active(name="baz", target=BannerNotificationTarget.ALL)
    BannerNotificationFactory.create(name="1", target=BannerNotificationTarget.USER)
    BannerNotificationFactory.create(name="2", target=BannerNotificationTarget.STAFF)
    BannerNotificationFactory.create(name="3", target=BannerNotificationTarget.ALL)
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - The user requests banner notifications filtered by is_active
    response = graphql(
        """
        query BannerNotifications($isVisible: Boolean!) {
            bannerNotifications(isVisible: $isVisible) {
                edges {
                    node {
                        name
                    }
                }
            }
        }
        """,
        variables={"isVisible": value},
    )

    # then:
    # - The response contains only the expected banner notifications
    content = load_content(response.content)
    notifications = content["data"]["bannerNotifications"]["edges"]
    assert notifications == expected, content
