from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice, UserRoleChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import patch_method
from tests.test_graphql_api.test_reservation.helpers import CHANGE_ACCESS_CODE_STAFF_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__regular_user(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_regular_user()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to change this reservation's access code."

    assert PindoraService.change_access_code.call_count == 0
    assert PindoraService.activate_access_code.call_count == 0


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
    ),
)
@patch_method(PindoraService.activate_access_code)
@patch_method(EmailService.send_reservation_access_code_changed_email)
def test_staff_change_access_code__unit_handler(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
        reservation_unit=reservation_unit,
    )

    data = {
        "pk": reservation.pk,
    }

    user = UserFactory.create_with_unit_role(role=UserRoleChoice.HANDLER, units=[reservation_unit.unit])

    graphql.force_login(user)
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.change_access_code.call_count == 1
    assert PindoraService.activate_access_code.call_count == 0
    assert EmailService.send_reservation_access_code_changed_email.call_count == 1


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
    ),
)
@patch_method(PindoraService.activate_access_code)
@patch_method(EmailService.send_reservation_access_code_changed_email)
def test_staff_change_access_code__general_handler(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    user = UserFactory.create_with_general_role(role=UserRoleChoice.HANDLER)

    graphql.force_login(user)
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.change_access_code.call_count == 1
    assert PindoraService.activate_access_code.call_count == 0
    assert EmailService.send_reservation_access_code_changed_email.call_count == 1
