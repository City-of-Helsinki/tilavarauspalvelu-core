from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import RecurringReservationFactory, ReservationFactory
from tests.helpers import patch_method

from .helpers import CHANGE_ACCESS_CODE_STAFF_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraClient.change_reservation_access_code)
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(EmailService.send_reservation_modified_access_code_email)
def test_staff_change_access_code(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.change_reservation_access_code.call_count == 1
    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert EmailService.send_reservation_modified_access_code_email.call_count == 1


@patch_method(PindoraClient.change_reservation_access_code)
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(EmailService.send_reservation_modified_access_code_email)
def test_staff_change_access_code__not_active(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        access_code_is_active=False,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert response.first_query_object["accessCodeIsActive"] is True

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True

    assert PindoraClient.change_reservation_access_code.call_count == 1
    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert EmailService.send_reservation_modified_access_code_email.call_count == 1


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__not_generated(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation must have an access code to change it."]


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__not_access_type_access_code(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.UNRESTRICTED,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=local_datetime() + datetime.timedelta(hours=1),
        end=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation access type does not use access codes."]


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__in_series(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be in a reservation series."]


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__state_not_confirmed(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation access code cannot be changed based on its state."]


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__type_is_blocked(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation access code cannot be changed based on its type."]


@patch_method(PindoraClient.change_reservation_access_code)
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(EmailService.send_reservation_modified_access_code_email)
def test_staff_change_access_code__ongoing(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraClient.change_reservation_access_code.call_count == 1
    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert EmailService.send_reservation_modified_access_code_email.call_count == 1


@patch_method(PindoraClient.change_reservation_access_code)
def test_staff_change_access_code__already_ended(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation has already ended."]


@patch_method(PindoraClient.change_reservation_access_code, side_effect=PindoraAPIError())
def test_staff_change_access_code__pindora_error(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Pindora client error"


@patch_method(PindoraClient.change_reservation_access_code, side_effect=PindoraNotFoundError("Not found"))
def test_staff_change_access_code__pindora_error__404(graphql):
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
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert response.first_query_object["accessCodeGeneratedAt"] is None
    assert response.first_query_object["accessCodeIsActive"] is False

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False
