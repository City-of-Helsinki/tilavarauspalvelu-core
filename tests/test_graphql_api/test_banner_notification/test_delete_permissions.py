import pytest

from tests.factories import BannerNotificationFactory
from tests.helpers import UserType

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("user_type", [UserType.STAFF, UserType.ANONYMOUS, UserType.REGULAR])
def test_banner_notification__delete__no_perms(graphql, user_type):
    # given:
    # - There is a draft banner notification in the system
    # - User of the given type is using the system
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_user_based_on_type(user_type)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        DELETE_MUTATION,
        input_data={
            "pk": notification.pk,
        },
    )

    # then:
    # - The response complains about permissions
    assert response.error_message() == "No permission to delete."


def test_banner_notification__delete__notification_manager(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(draft=True)
    graphql.login_user_based_on_type(UserType.NOTIFICATION_MANAGER)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        DELETE_MUTATION,
        variables={
            "input": {
                "pk": notification.pk,
            }
        },
    )

    # then:
    # - The response has no errors
    assert response.has_errors is False
