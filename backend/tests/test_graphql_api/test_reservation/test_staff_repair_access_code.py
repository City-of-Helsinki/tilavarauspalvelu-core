from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from utils.date_utils import local_datetime

from tests.factories import RecurringReservationFactory, ReservationFactory
from tests.helpers import patch_method

from .helpers import REPAIR_ACCESS_CODE_STAFF_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_modified_email)
def test_staff_repair_access_code(graphql):
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at is not None

    assert PindoraService.sync_access_code.call_count == 1
    assert EmailService.send_reservation_modified_email.call_count == 1


def test_staff_repair_access_code__access_type_not_access_code(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.UNRESTRICTED,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation access type does not use access codes."]


def test_staff_repair_access_code__in_series(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
        recurring_reservation=RecurringReservationFactory.create(),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be in a reservation series."]


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_reservation_modified_email)
def test_staff_repair_access_code__ongoing(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() - datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=1),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert EmailService.send_reservation_modified_email.call_count == 1


@patch_method(PindoraService.sync_access_code)
def test_staff_repair_access_code__has_ended(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=local_datetime() - datetime.timedelta(hours=2),
        end=local_datetime() - datetime.timedelta(hours=1),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation has already ended."]


@patch_method(PindoraService.sync_access_code, side_effect=PindoraAPIError("Pindora Error"))
def test_staff_repair_access_code__pindora_call_fails(graphql):
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Pindora Error"]

    assert PindoraService.sync_access_code.call_count == 1
