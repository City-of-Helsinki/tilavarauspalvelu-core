import pytest

from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from tests.factories import BannerNotificationFactory, UserFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user_deletes_banner_notification(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        DELETE_MUTATION,
        input_data={
            "pk": notification.pk,
        },
    )

    # then:
    # - The response has no errors
    # - The banner notification was deleted
    assert response.has_errors is False, response.errors
    assert BannerNotification.objects.exists() is False


def test_primary_key_is_required_for_deleting(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User tries to delete the banner notification
    response = graphql(DELETE_MUTATION, input_data={})

    # then:
    # - The response complains about the improper input
    assert response.error_message().startswith("Variable '$input'")


def test_user_tries_to_delete_non_existing_banner_notification(graphql):
    # given:
    # - There is no draft banner notifications in the system
    # - Notification manager is using the system
    assert BannerNotification.objects.count() == 0
    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    # when:
    # - User tries to delete a banner notification
    response = graphql(
        DELETE_MUTATION,
        input_data={
            "pk": 1,
        },
    )

    # then:
    # - The response complains about missing banner notification
    assert response.error_message() == "`BannerNotification` object matching query `{'pk': '1'}` does not exist."
