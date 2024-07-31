import pytest

from common.enums import BannerNotificationLevel, BannerNotificationTarget
from tests.helpers import UserType
from tests.test_graphql_api.test_banner_notification.helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("user_type", [UserType.STAFF, UserType.ANONYMOUS, UserType.REGULAR])
def test_banner_notification__create__no_perms(graphql, user_type):
    # given:
    # - User of the given type is using the system
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User tries to create a new banner notification
    response = graphql(
        CREATE_MUTATION,
        input_data={
            "name": "foo",
            "message": "bar",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to create."


def test_banner_notification__create__notification_manager(graphql):
    # given:
    # - User of the given type is using the system
    graphql.login_user_based_on_type(UserType.NOTIFICATION_MANAGER)

    # when:
    # - User tries to create a new banner notification
    response = graphql(
        CREATE_MUTATION,
        input_data={
            "name": "foo",
            "message": "bar",
            "target": BannerNotificationTarget.ALL.value,
            "level": BannerNotificationLevel.NORMAL.value,
        },
    )

    # then:
    # - The response has no errors
    assert response.has_errors is False
