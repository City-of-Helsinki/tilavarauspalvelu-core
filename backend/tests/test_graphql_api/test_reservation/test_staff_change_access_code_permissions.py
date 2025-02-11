from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice, UserRoleChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import patch_method
from tests.test_graphql_api.test_reservation.helpers import CHANGE_ACCESS_CODE_STAFF_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__regular_user(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_regular_user()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."

    assert PindoraClient.change_reservation_access_code.call_count == 0


@patch_method(PindoraClient.change_reservation_access_code)
@patch_method(PindoraClient.activate_reservation_access_code)
def test_staff_change_access_code__unit_handler(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
        reservation_units=[reservation_unit],
    )

    data = {
        "pk": reservation.pk,
    }

    user = UserFactory.create_with_unit_role(role=UserRoleChoice.HANDLER, units=[reservation_unit.unit])

    graphql.force_login(user)
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.change_reservation_access_code.call_count == 1
    assert PindoraClient.activate_reservation_access_code.call_count == 1


@patch_method(PindoraClient.change_reservation_access_code)
@patch_method(PindoraClient.activate_reservation_access_code)
def test_staff_change_access_code__general_handler(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    user = UserFactory.create_with_general_role(role=UserRoleChoice.HANDLER)

    graphql.force_login(user)
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.change_reservation_access_code.call_count == 1
    assert PindoraClient.activate_reservation_access_code.call_count == 1
