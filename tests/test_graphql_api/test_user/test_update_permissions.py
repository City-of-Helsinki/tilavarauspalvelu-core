import pytest
from graphene_django_extensions.testing import build_mutation

from tests.factories import UserFactory
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


UPDATE_MUTATION = build_mutation("updateUser", "UserUpdateMutation")


def test_user__update__anonymous_user(graphql):
    user = UserFactory.create_staff_user()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__cannot_update_other_user(graphql):
    user = UserFactory.create_staff_user()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__regular_user(graphql):
    user = graphql.login_user_based_on_type(UserType.REGULAR)

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__staff_user(graphql):
    user = graphql.login_user_based_on_type(UserType.STAFF)

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.reservation_notification == "none"


def test_user__update__superuser(graphql):
    user = graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.reservation_notification == "none"
