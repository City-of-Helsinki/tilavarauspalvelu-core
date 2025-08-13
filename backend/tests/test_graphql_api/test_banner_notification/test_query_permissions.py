from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import BannerNotificationTarget, UserRoleChoice
from utils.date_utils import local_datetime

from tests.factories import BannerNotificationFactory, UserFactory
from tests.factories.banner_notification import BannerNotificationBuilder
from tests.helpers import parametrize_helper

from .helpers import FieldParams, TargetParams, UserType, UserTypeParams

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


_PRIVATE_FIELDS = ("draft", "name", "target", "state")


def login_based_on_type(graphql, user_type: UserType) -> User | None:
    match user_type:
        case UserType.ANONYMOUS:
            return None
        case UserType.REGULAR:
            return graphql.login_with_regular_user()
        case UserType.SUPERUSER:
            return graphql.login_with_superuser()
        case UserType.STAFF:
            user = UserFactory.create_with_general_role(role=UserRoleChoice.RESERVER)
            return graphql.force_login(user)
        case UserType.NOTIFICATION_MANAGER:
            user = UserFactory.create_with_general_role(role=UserRoleChoice.NOTIFICATION_MANAGER)
            return graphql.force_login(user)


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Anonymous user should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Anonymous user should not see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.ANONYMOUS,
                expected=0,
            ),
            "Regular user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Regular user should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Regular user should not see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.REGULAR,
                expected=0,
            ),
            "Staff user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Staff user should not see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.STAFF,
                expected=0,
            ),
            "Staff user should see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Notification manager should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
            "Notification manager should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
            "Notification manager should see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
        },
    ),
)
def test_user_permissions_on_banner_notifications(graphql, target, user_type, expected):
    # given:
    # - There is an active notification with the given target
    # - User of the given type is using the system
    BannerNotificationBuilder().active().create(target=target)
    login_based_on_type(graphql, user_type)

    # when:
    # - User requests banner notifications visible for them
    query = """
        query {
          bannerNotifications (filter: {isVisible: true}){
            edges {
              node {
                messageFi
              }
            }
          }
        }
    """
    response = graphql(query)

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Anonymous user should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Anonymous user should not see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.ANONYMOUS,
                expected=0,
            ),
            "Regular user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Regular user should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Regular user should not see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.REGULAR,
                expected=0,
            ),
            "Staff user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Staff user should not see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.STAFF,
                expected=0,
            ),
            "Staff user should see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Notification manager should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
            "Notification manager should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
            "Notification manager should see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
        },
    ),
)
def test_user_permissions_on_banner_notifications_with_target_filter(graphql, target, user_type, expected):
    # given:
    # - There are banner notification for all target audiences in the system
    # - User of the given type is using the system
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
    login_based_on_type(graphql, user_type)

    # when:
    # - User requests banner notifications visible for them in the given target audience
    query = """
        query ($target: BannerNotificationTarget!) {
          bannerNotifications (filter: {isVisible: true, target: $target}){
            edges {
              node {
                messageFi
              }
            }
          }
        }
    """
    response = graphql(query, variables={"target": target})

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should not see any notifications": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected=[
                    {"node": None},
                    {"node": None},
                ],
            ),
            "Regular user should not see any notifications": UserTypeParams(
                user_type=UserType.REGULAR,
                expected=[
                    {"node": None},
                    {"node": None},
                ],
            ),
            "Staff user should not see any notifications": UserTypeParams(
                user_type=UserType.STAFF,
                expected=[
                    {"node": None},
                    {"node": None},
                ],
            ),
            "Notification manager should see notification meant for users & staff & all": UserTypeParams(
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=[
                    {"node": {"messageFi": "1", "target": "ALL"}},
                    {"node": {"messageFi": "2", "target": "USER"}},
                    {"node": {"messageFi": "3", "target": "STAFF"}},
                ],
            ),
        },
    ),
)
def test_user_permissions_on_banner_notifications_without_target_filter(graphql, user_type, expected):
    # given:
    # - There are banner notification for all target audiences in the system
    # - User of the given type is using the system
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
    login_based_on_type(graphql, user_type)

    # when:
    # - User requests banner notifications visible for them (without target filter)
    query = """
        query {
          bannerNotifications (filter: {isVisible: true}, orderBy: pkAsc) {
            edges {
              node {
                messageFi
                target
              }
            }
          }
        }
    """
    response = graphql(query)

    # then:
    # - The response contains the expected notifications
    assert response.edges == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            **{
                f"Anonymous user should not have access to the {field} field": FieldParams(
                    field=field,
                    user_type=UserType.ANONYMOUS,
                    expected=1,
                )
                for field in _PRIVATE_FIELDS
            },
            **{
                f"Regular user should not have access to the {field} field": FieldParams(
                    field=field,
                    user_type=UserType.REGULAR,
                    expected=1,
                )
                for field in _PRIVATE_FIELDS
            },
            **{
                f"Staff user should not have access to the {field} field": FieldParams(
                    field=field,
                    user_type=UserType.STAFF,
                    expected=1,
                )
                for field in _PRIVATE_FIELDS
            },
            **{
                f"Notification manager should have access to the {field} field": FieldParams(
                    field=field,
                    user_type=UserType.NOTIFICATION_MANAGER,
                    expected=0,
                )
                for field in _PRIVATE_FIELDS
            },
        },
    ),
)
def test_field_permissions_on_banner_notifications(graphql, field, user_type, expected):
    # given:
    # - There is an active notification for all
    # - User of the given type is using the system
    BannerNotificationBuilder().active().create(target=BannerNotificationTarget.ALL)
    login_based_on_type(graphql, user_type)

    # when:
    # - User requests given fields in banner notifications
    query = f"""
        query {{
          bannerNotifications (filter: {{isVisible: true}}){{
            edges {{
              node {{
                {field}
              }}
            }}
          }}
        }}
    """
    response = graphql(query)

    # then:
    # - The response contains the expected amount of errors
    # - The error complains about the selected field
    errors = response.json.get("errors", [])
    assert len(errors) == expected, response
    if errors:
        assert errors[0]["path"][-1] == field


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should not see a draft banner notification": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected=0,
            ),
            "Regular user should not see a draft banner notification": UserTypeParams(
                user_type=UserType.REGULAR,
                expected=0,
            ),
            "Staff user should not see a draft banner notification": UserTypeParams(
                user_type=UserType.STAFF,
                expected=0,
            ),
            "Notification manager user should see a draft banner notification": UserTypeParams(
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
        },
    ),
)
def test_permissions_on_non_visible_banner_notifications(graphql, user_type, expected):
    # given:
    # - There is a draft notification for all
    # - User of the given type is using the system
    BannerNotificationFactory.create(target=BannerNotificationTarget.ALL, draft=True)
    login_based_on_type(graphql, user_type)

    # when:
    # - User requests banner notifications visible for them
    query = """
        query {
          bannerNotifications (filter: {isVisible: false}){
            edges {
              node {
                messageFi
              }
            }
          }
        }
        """
    response = graphql(query)

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Regular user": UserTypeParams(
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Staff user": UserTypeParams(
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Notification manager": UserTypeParams(
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=2,
            ),
        },
    ),
)
def test_permission_on_both_non_visible_and_visible_banner_notifications(graphql, user_type, expected):
    # given:
    # - There is a draft notification for all & an active notification for all
    # - User of the given type is using the system
    now = local_datetime()

    BannerNotificationFactory.create(
        target=BannerNotificationTarget.ALL,
        draft=True,
    )
    BannerNotificationFactory.create(
        target=BannerNotificationTarget.ALL,
        draft=False,
        active_from=now - datetime.timedelta(days=1),
        active_until=now + datetime.timedelta(days=1),
    )

    login_based_on_type(graphql, user_type)

    # when:
    # - User requests all banner notifications
    query = """
        query {
          bannerNotifications {
            edges {
              node {
                messageFi
              }
            }
          }
        }
    """
    response = graphql(query)

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response
