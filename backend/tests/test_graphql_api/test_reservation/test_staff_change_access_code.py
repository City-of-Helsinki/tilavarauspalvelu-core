from __future__ import annotations

import datetime

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import ReservationFactory, ReservationSeriesFactory
from tests.helpers import patch_method

from .helpers import CHANGE_ACCESS_CODE_STAFF_MUTATION

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
    ),
)
@patch_method(PindoraService.activate_access_code)
@patch_method(EmailService.send_reservation_access_code_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_staff_change_access_code(graphql):
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

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.change_access_code.call_count == 1
    assert PindoraService.activate_access_code.call_count == 0
    assert EmailService.send_reservation_access_code_changed_email.call_count == 1


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=False,
    ),
)
@patch_method(PindoraService.activate_access_code)
@patch_method(EmailService.send_reservation_access_code_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_staff_change_access_code__not_active(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=datetime.datetime(2024, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        access_code_is_active=False,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.change_access_code.call_count == 1
    assert PindoraService.activate_access_code.call_count == 1
    assert EmailService.send_reservation_access_code_changed_email.call_count == 1


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=False,
    ),
)
@patch_method(PindoraService.activate_access_code, side_effect=PindoraAPIError("Pindora Error"))
@patch_method(EmailService.send_reservation_access_code_changed_email)
@patch_method(SentryLogger.log_exception)
def test_staff_change_access_code__not_active__pindora_call_fails(graphql):
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.change_access_code.call_count == 1
    assert PindoraService.activate_access_code.call_count == 1

    # Email not sent since access code is not active due to activation failing
    # This will be corrected by a background task, and an email will be sent then.
    assert EmailService.send_reservation_access_code_changed_email.call_count == 0

    assert SentryLogger.log_exception.called is True


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__not_generated(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation must have an access code to change it."


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__not_access_type_access_code(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.UNRESTRICTED,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation access type does not use access codes."


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__in_series(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
        reservation_series=ReservationSeriesFactory.create(),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation cannot be in a reservation series."


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__state_not_confirmed(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
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

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation access code cannot be changed based on its state."


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__type_is_blocked(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() + datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=2),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation access code cannot be changed based on its type."


@patch_method(
    PindoraService.change_access_code,
    return_value=PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
    ),
)
@patch_method(PindoraService.activate_access_code)
@patch_method(EmailService.send_reservation_access_code_changed_email)
def test_staff_change_access_code__ongoing(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() - datetime.timedelta(hours=1),
        ends_at=local_datetime() + datetime.timedelta(hours=1),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.change_access_code.call_count == 1
    assert PindoraService.activate_access_code.call_count == 0
    assert EmailService.send_reservation_access_code_changed_email.call_count == 1


@patch_method(PindoraService.change_access_code)
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__already_ended(graphql):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begins_at=local_datetime() - datetime.timedelta(hours=2),
        ends_at=local_datetime() - datetime.timedelta(hours=1),
    )

    data = {
        "pk": reservation.pk,
    }

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation has already ended."


@patch_method(PindoraService.change_access_code, side_effect=PindoraAPIError("Pindora Error"))
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__pindora_error(graphql):
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

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Pindora Error"


@patch_method(PindoraService.change_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraService.activate_access_code)
def test_staff_change_access_code__pindora_error__404(graphql):
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

    graphql.login_with_superuser()
    response = graphql(CHANGE_ACCESS_CODE_STAFF_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors
    assert response.results["accessCodeGeneratedAt"] is None
    assert response.results["accessCodeIsActive"] is False

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False
