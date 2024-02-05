import pytest

from tests.factories import UserFactory
from tests.gql_builders import build_mutation
from tests.helpers import UserType
from users.models import ReservationNotification

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


UPDATE_MUTATION = build_mutation(
    "updateUser",
    "UserUpdateMutationInput",
)


def test_user__update(graphql):
    user = graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": user.pk, "reservationNotification": ReservationNotification.NONE.value}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert response.first_query_object["pk"] == user.pk

    user.refresh_from_db()
    assert user.reservation_notification == ReservationNotification.NONE.value


def test_user__update__not_self(graphql):
    user = UserFactory.create_staff_user()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"pk": user.pk, "reservationNotification": ReservationNotification.NONE.value}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate"
