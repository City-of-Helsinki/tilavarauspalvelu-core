from typing import Any, NamedTuple

import pytest

from common.choices import BannerNotificationLevel, BannerNotificationTarget
from tests.factories import BannerNotificationFactory
from tests.helpers import UserType, parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


class UserTypeParams(NamedTuple):
    user_type: UserType
    expected: Any


class TargetParams(NamedTuple):
    target: BannerNotificationTarget
    user_type: UserType
    expected: Any


class FieldParams(NamedTuple):
    field: str
    user_type: UserType
    expected: Any


_PRIVATE_FIELDS = ("draft", "name", "target", "state")


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
    BannerNotificationFactory.create_active(target=target)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User requests banner notifications visible for them
    response = graphql(
        """
        query {
          bannerNotifications (isVisible: true){
            edges {
              node {
                message
              }
            }
          }
        }
        """,
    )

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL.value,
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Anonymous user should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER.value,
                user_type=UserType.ANONYMOUS,
                expected=1,
            ),
            "Anonymous user should not see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF.value,
                user_type=UserType.ANONYMOUS,
                expected=0,
            ),
            "Regular user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL.value,
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Regular user should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER.value,
                user_type=UserType.REGULAR,
                expected=1,
            ),
            "Regular user should not see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF.value,
                user_type=UserType.REGULAR,
                expected=0,
            ),
            "Staff user should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL.value,
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Staff user should not see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER.value,
                user_type=UserType.STAFF,
                expected=0,
            ),
            "Staff user should see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF.value,
                user_type=UserType.STAFF,
                expected=1,
            ),
            "Notification manager should see notification meant for all": TargetParams(
                target=BannerNotificationTarget.ALL.value,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
            "Notification manager should see notification meant for users": TargetParams(
                target=BannerNotificationTarget.USER.value,
                user_type=UserType.NOTIFICATION_MANAGER,
                expected=1,
            ),
            "Notification manager should see notification meant for staff": TargetParams(
                target=BannerNotificationTarget.STAFF.value,
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
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User requests banner notifications visible for them in the given target audience
    response = graphql(
        f"""
        query {{
          bannerNotifications (isVisible: true, target: {target}){{
            edges {{
              node {{
                message
              }}
            }}
          }}
        }}
        """,
    )

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
                    {"node": {"message": "1", "target": "ALL"}},
                    {"node": {"message": "2", "target": "USER"}},
                    {"node": {"message": "3", "target": "STAFF"}},
                ],
            ),
        },
    ),
)
def test_user_permissions_on_banner_notifications_without_target_filter(graphql, user_type, expected):
    # given:
    # - There are banner notification for all target audiences in the system
    # - User of the given type is using the system
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
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User requests banner notifications visible for them (without target filter)
    response = graphql(
        """
        query {
          bannerNotifications (isVisible: true, orderBy: "pk") {
            edges {
              node {
                message
                target
              }
            }
          }
        }
        """
    )

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
    BannerNotificationFactory.create_active(target=BannerNotificationTarget.ALL)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User requests given fields in banner notifications
    response = graphql(
        f"""
        query {{
          bannerNotifications (isVisible: true){{
            edges {{
              node {{
                {field}
              }}
            }}
          }}
        }}
        """,
    )

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
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User requests banner notifications visible for them
    response = graphql(
        """
        query {
          bannerNotifications (isVisible: false){
            edges {
              node {
                message
              }
            }
          }
        }
        """,
    )

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should not see a both visible and non-visible banner notifications": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected=0,
            ),
            "Regular user should not see a both visible and non-visible banner notifications": UserTypeParams(
                user_type=UserType.REGULAR,
                expected=0,
            ),
            "Staff user should not see a both visible and non-visible banner notifications": UserTypeParams(
                user_type=UserType.STAFF,
                expected=0,
            ),
            "Notification manager should see a both visible and non-visible banner notifications": UserTypeParams(
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
    BannerNotificationFactory.create(target=BannerNotificationTarget.ALL, draft=True)
    BannerNotificationFactory.create_active(target=BannerNotificationTarget.ALL)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User requests all banner notifications
    response = graphql(
        """
        query {
          bannerNotifications {
            edges {
              node {
                message
              }
            }
          }
        }
        """,
    )

    # then:
    # - The response contains the expected amount of notifications
    assert len(response.edges) == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should not be able to create banner notifications": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected={
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        }
                    ],
                    "message": None,
                    "name": None,
                },
            ),
            "Regular user should not be able to create banner notifications": UserTypeParams(
                user_type=UserType.REGULAR,
                expected={
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        }
                    ],
                    "message": None,
                    "name": None,
                },
            ),
            "Staff user should not be able to create banner notifications": UserTypeParams(
                user_type=UserType.STAFF,
                expected={
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        }
                    ],
                    "message": None,
                    "name": None,
                },
            ),
            "Notification manager should be able to create banner notifications": UserTypeParams(
                user_type=UserType.NOTIFICATION_MANAGER,
                expected={
                    "name": "foo",
                    "message": "bar",
                    "errors": None,
                },
            ),
        },
    ),
)
def test_permission_on_creating_banner_notifications(graphql, user_type, expected):
    # given:
    # - User of the given type is using the system
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User tries to create a new banner notification
    response = graphql(
        """
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
        """,
        variables={
            "input": {
                "name": "foo",
                "message": "bar",
                "target": BannerNotificationTarget.ALL.value,
                "level": BannerNotificationLevel.NORMAL.value,
            },
        },
    )

    # then:
    # - The response contains the expected result
    assert response.first_query_object == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should not be able to update banner notifications": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected={
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        },
                    ],
                    "message": None,
                    "name": None,
                },
            ),
            "Regular user should not be able to update banner notifications": UserTypeParams(
                user_type=UserType.REGULAR,
                expected={
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        },
                    ],
                    "message": None,
                    "name": None,
                },
            ),
            "Staff user should not be able to update banner notifications": UserTypeParams(
                user_type=UserType.STAFF,
                expected={
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        },
                    ],
                    "message": None,
                    "name": None,
                },
            ),
            "Notification manager should be able to update banner notifications": UserTypeParams(
                user_type=UserType.NOTIFICATION_MANAGER,
                expected={
                    "name": "1",
                    "message": "2",
                    "errors": None,
                },
            ),
        },
    ),
)
def test_permission_on_updating_banner_notifications(graphql, user_type, expected):
    # given:
    # - There is a draft notification in the system
    # - User of the given type is using the system
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User tries to update the banner notification
    response = graphql(
        """
        mutation ($input: BannerNotificationUpdateMutationInput!) {
          updateBannerNotification(input: $input) {
            name
            message
            errors {
              field
              messages
            }
          }
        }
        """,
        variables={
            "input": {
                "pk": notification.pk,
                "name": "1",
                "message": "2",
            },
        },
    )

    # then:
    # - The response contains the expected result
    assert response.first_query_object == expected, response


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Anonymous user should not be able to delete banner notifications": UserTypeParams(
                user_type=UserType.ANONYMOUS,
                expected={
                    "deleted": False,
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        },
                    ],
                    "rowCount": 0,
                },
            ),
            "Regular user should not be able to delete banner notifications": UserTypeParams(
                user_type=UserType.REGULAR,
                expected={
                    "deleted": False,
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        },
                    ],
                    "rowCount": 0,
                },
            ),
            "Staff user should not be able to delete banner notifications": UserTypeParams(
                user_type=UserType.STAFF,
                expected={
                    "deleted": False,
                    "errors": [
                        {
                            "field": "nonFieldErrors",
                            "messages": [
                                "No permission to mutate.",
                            ],
                        },
                    ],
                    "rowCount": 0,
                },
            ),
            "Notification manager should be able to delete banner notifications": UserTypeParams(
                user_type=UserType.NOTIFICATION_MANAGER,
                expected={
                    "deleted": True,
                    "errors": None,
                    "rowCount": 1,
                },
            ),
        },
    ),
)
def test_permission_on_deleting_banner_notifications(graphql, user_type, expected):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        """
        mutation ($input: BannerNotificationDeleteMutationInput!) {
          deleteBannerNotification(input: $input) {
            deleted
            rowCount
            errors {
              field
              messages
            }
          }
        }
        """,
        variables={
            "input": {
                "pk": notification.pk,
            }
        },
    )

    # then:
    # - The response contains the result of the deletion
    assert response.first_query_object == expected, response
