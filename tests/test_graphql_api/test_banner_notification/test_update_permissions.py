import pytest

from tests.factories import BannerNotificationFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("user_type", [UserType.STAFF, UserType.ANONYMOUS, UserType.REGULAR])
def test_banner_notification__update__no_perms(graphql, user_type):
    # given:
    # - There is a draft notification in the system
    # - User of the given type is using the system
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User tries to update the banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
        },
    )

    # then:
    # - The response complains about the lack of permissions
    assert response.error_message() == "No permission to update."


def test_banner_notification__update__notification_manager(graphql):
    # given:
    # - There is a draft notification in the system
    # - User of the given type is using the system
    notification = BannerNotificationFactory.create(draft=True, name="foo", message="bar")
    graphql.login_user_based_on_type(UserType.NOTIFICATION_MANAGER)

    # when:
    # - User tries to update the banner notification
    response = graphql(
        UPDATE_MUTATION,
        input_data={
            "pk": notification.pk,
            "name": "1",
            "message": "2",
        },
    )

    # then:
    # - The response has no errors
    assert response.has_errors is False
