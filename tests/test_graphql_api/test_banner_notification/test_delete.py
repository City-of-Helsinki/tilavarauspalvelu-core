import pytest

from common.models import BannerNotification
from tests.factories import BannerNotificationFactory, UserFactory
from tests.helpers import deprecated_field_error_messages

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


MUTATION_QUERY = """
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
    """


def test_user_deletes_banner_notification(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    notification = BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        MUTATION_QUERY,
        input_data={
            "pk": notification.pk,
        },
    )

    # then:
    # - The response contains the result of the deletion
    assert response.first_query_object == {
        "deleted": True,
        "rowCount": 1,
        "errors": None,
    }, response


def test_primary_key_is_required_for_deleting(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to delete the banner notification
    response = graphql(MUTATION_QUERY, input_data={})

    # then:
    # - The response complains about the improper input
    assert (
        response.error_message()
        == "Variable '$input' of required type 'BannerNotificationDeleteMutationInput!' was not provided."
    )


def test_user_tries_to_delete_non_existing_banner_notification(graphql):
    # given:
    # - There is no draft banner notifications in the system
    # - Notification manager is using the system
    assert BannerNotification.objects.count() == 0
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to delete a banner notification
    response = graphql(
        MUTATION_QUERY,
        input_data={
            "pk": 1,
        },
    )

    # then:
    # - The response complains about missing banner notification
    assert deprecated_field_error_messages(response, "nonFieldErrors") == ["Object does not exist."]
