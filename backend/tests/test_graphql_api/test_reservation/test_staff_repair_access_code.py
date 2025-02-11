from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraConflictError, PindoraNotFoundError
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import RecurringReservationFactory, ReservationFactory
from tests.helpers import patch_method

from .helpers import REPAIR_ACCESS_CODE_STAFF_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(PindoraClient.create_reservation)
@patch_method(PindoraClient.get_reservation)
@patch_method(EmailService.send_reservation_modified_access_code_email)
def test_staff_repair_access_code__should_be_active(graphql):
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

    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0
    assert PindoraClient.create_reservation.call_count == 0
    assert PindoraClient.get_reservation.call_count == 0
    assert EmailService.send_reservation_modified_access_code_email.call_count == 1


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(PindoraClient.create_reservation)
@patch_method(PindoraClient.get_reservation)
def test_staff_repair_access_code__should_not_be_active(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
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
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is not None

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 1
    assert PindoraClient.create_reservation.call_count == 0
    assert PindoraClient.get_reservation.call_count == 0


@patch_method(EmailService.send_reservation_modified_access_code_email)
@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(
    PindoraClient.create_reservation,
    return_value={
        "access_code_generated_at": datetime.datetime(2024, 1, 2, tzinfo=DEFAULT_TIMEZONE),
        "access_code_is_active": True,
    },
)
def test_staff_repair_access_code__create_new_access_code(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE),
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
    assert reservation.access_code_generated_at == datetime.datetime(2024, 1, 2, tzinfo=DEFAULT_TIMEZONE)

    assert EmailService.send_reservation_modified_access_code_email.call_count == 1


@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraClient.create_reservation, side_effect=PindoraConflictError("Conflict"))
@patch_method(
    PindoraClient.get_reservation,
    return_value={
        "access_code_generated_at": datetime.datetime(2024, 1, 2, tzinfo=DEFAULT_TIMEZONE),
        "access_code_is_active": True,
    },
)
def test_staff_repair_access_code__get_access_code_info(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE),
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
    assert reservation.access_code_generated_at == datetime.datetime(2024, 1, 2, tzinfo=DEFAULT_TIMEZONE)


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


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(EmailService.send_reservation_modified_access_code_email)
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
    assert EmailService.send_reservation_modified_access_code_email.call_count == 1


@patch_method(PindoraClient.activate_reservation_access_code)
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
