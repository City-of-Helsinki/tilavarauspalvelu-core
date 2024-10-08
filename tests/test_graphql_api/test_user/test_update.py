import pytest
from graphene_django_extensions.testing import build_mutation

from tests.factories import UserFactory
from tilavarauspalvelu.enums import ReservationNotification

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


UPDATE_MUTATION = build_mutation("updateUser", "UserUpdateMutation")


def test_user__update(graphql):
    user = graphql.login_with_superuser()

    data = {"pk": user.pk, "reservationNotification": ReservationNotification.NONE.value.upper()}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert response.first_query_object["pk"] == user.pk

    user.refresh_from_db()
    assert user.reservation_notification == ReservationNotification.NONE.value


def test_user__update__not_self(graphql):
    user = UserFactory.create_superuser()
    graphql.login_with_superuser()

    data = {"pk": user.pk, "reservationNotification": ReservationNotification.NONE.value.upper()}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
