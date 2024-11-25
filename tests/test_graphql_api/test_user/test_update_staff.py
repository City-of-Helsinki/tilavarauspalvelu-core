import pytest

from tilavarauspalvelu.enums import ReservationNotification

from tests.factories import UserFactory

from .helpers import STAFF_UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__update_staff(graphql):
    user = UserFactory.create_superuser(reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED)

    data = {
        "pk": user.pk,
        "reservationNotification": ReservationNotification.NONE.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(STAFF_UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False
    assert response.first_query_object["pk"] == user.pk

    user.refresh_from_db()
    assert user.reservation_notification == ReservationNotification.NONE
