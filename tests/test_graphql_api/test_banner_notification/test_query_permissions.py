import pytest
from graphene_django_extensions.testing import parametrize_helper

from common.choices import BannerNotificationTarget
from tests.factories import BannerNotificationFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_banner_notification.helpers import FieldParams, TargetParams, UserTypeParams

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

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
          bannerNotifications (isVisible: true, orderBy: pkAsc) {
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
