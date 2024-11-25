from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ReservationNotification, UserRoleChoice

from tests.factories import UserFactory

from .helpers import STAFF_UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__update__superuser(graphql):
    user = UserFactory.create_superuser(reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED)
    graphql.force_login(user)

    data = {
        "pk": user.pk,
        "reservationNotification": ReservationNotification.NONE.value.upper(),
    }
    response = graphql(STAFF_UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.reservation_notification == ReservationNotification.NONE


def test_user__update__anonymous_user(graphql):
    user = UserFactory.create(reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED)

    data = {
        "pk": user.pk,
        "reservationNotification": ReservationNotification.NONE.value.upper(),
    }
    response = graphql(STAFF_UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__cannot_update_other_user(graphql):
    user = UserFactory.create_superuser(reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED)
    graphql.login_with_regular_user()

    data = {
        "pk": user.pk,
        "reservationNotification": ReservationNotification.NONE.value.upper(),
    }
    response = graphql(STAFF_UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__regular_user(graphql):
    user = UserFactory.create(reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED)
    graphql.force_login(user)

    data = {
        "pk": user.pk,
        "reservationNotification": ReservationNotification.NONE.value.upper(),
    }
    response = graphql(STAFF_UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_user__update__admin_user(graphql):
    user = UserFactory.create_with_general_role(
        role=UserRoleChoice.ADMIN,
        reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
    )
    graphql.force_login(user)

    data = {
        "pk": user.pk,
        "reservationNotification": ReservationNotification.NONE.value.upper(),
    }
    response = graphql(STAFF_UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    user.refresh_from_db()
    assert user.reservation_notification == ReservationNotification.NONE
