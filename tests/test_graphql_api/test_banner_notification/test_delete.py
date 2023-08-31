import pytest

from common.models import BannerNotification
from tests.factories import BannerNotificationFactory
from tests.factories.user import UserFactory
from tests.helpers import load_content

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
        variables={
            "input": {
                "pk": notification.pk,
            }
        },
    )

    # then:
    # - The response contains the result of the deletion
    content = load_content(response.content)
    assert content == {
        "data": {
            "deleteBannerNotification": {
                "deleted": True,
                "rowCount": 1,
                "errors": None,
            },
        },
    }


def test_primary_key_is_required_for_deleting(graphql):
    # given:
    # - There is a draft banner notification in the system
    # - Notification manager is using the system
    BannerNotificationFactory.create(draft=True)
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        MUTATION_QUERY,
        variables={"input": {}},
    )

    # then:
    # - The response contains an error about missing primary key in the input
    content = load_content(response.content)
    assert content == {
        "errors": [
            {
                "locations": [{"column": 15, "line": 2}],
                "message": "Variable '$input' got invalid value {}; Field 'pk' of "
                "required type 'ID!' was not provided.",
            },
        ],
    }


def test_user_tries_to_delete_non_existing_banner_notification(graphql):
    # given:
    # - There is no draft banner notification in the system
    # - Notification manager is using the system
    assert BannerNotification.objects.count() == 0
    user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
    graphql.force_login(user)

    # when:
    # - User tries to delete the banner notification
    response = graphql(
        MUTATION_QUERY,
        variables={
            "input": {
                "pk": 1,
            }
        },
    )

    # then:
    # - The response contains the result of the deletion
    content = load_content(response.content)
    assert content == {
        "data": {
            "deleteBannerNotification": {
                "deleted": False,
                "errors": [
                    {
                        "field": "nonFieldErrors",
                        "messages": [
                            "Object does not exist.",
                        ],
                    },
                ],
                "rowCount": 0,
            }
        }
    }
