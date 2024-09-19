import pytest
from graphene_django_extensions.testing import build_mutation

from tests.factories import UserFactory
from tilavarauspalvelu.enums import UserRoleChoice

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


UPDATE_MUTATION = build_mutation("updateUser", "UserUpdateMutation")


def test_user__update__anonymous_user(graphql):
    user = UserFactory.create()

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__cannot_update_other_user(graphql):
    user = UserFactory.create()
    graphql.login_with_superuser()

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__regular_user(graphql):
    user = graphql.login_with_regular_user()

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__admin_user(graphql):
    user = graphql.login_user_with_role(role=UserRoleChoice.ADMIN)

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.reservation_notification == "none"


def test_user__update__superuser(graphql):
    user = graphql.login_with_superuser()

    data = {"pk": user.pk, "reservationNotification": "NONE"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.reservation_notification == "none"
