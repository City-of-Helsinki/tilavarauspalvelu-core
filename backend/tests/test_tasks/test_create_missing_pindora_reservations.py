from __future__ import annotations

import datetime
import uuid

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraReservationResponse
from tilavarauspalvelu.tasks import create_missing_pindora_reservations_task
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import ReservationFactory, ReservationSeriesFactory, ReservationUnitFactory
from tests.helpers import patch_method

# ── Helpers ──


def pindora_reservation_response(*, access_code_is_active: bool) -> PindoraReservationResponse:
    return PindoraReservationResponse(
        reservation_unit_id=uuid.UUID("3f9c5ad4-1a0e-4d2c-9a57-2a3c8a1b4e6f"),
        access_code="13245#",
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_valid_minutes_before=0,
        access_code_valid_minutes_after=0,
        access_code_generated_at=datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        access_code_is_active=access_code_is_active,
        begin=datetime.datetime(2023, 1, 2, 12, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 2, 13, tzinfo=DEFAULT_TIMEZONE),
    )


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value=pindora_reservation_response(access_code_is_active=True),
)
@patch_method(EmailService.send_reservation_access_type_changed_email)
def test_create_missing_pindora_reservations__create_missing():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.create_reservation.call_args.kwargs["is_active"] is True
    assert EmailService.send_reservation_access_type_changed_email.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value=pindora_reservation_response(access_code_is_active=False),
)
def test_create_missing_pindora_reservations__blocked():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.create_reservation.call_args.kwargs["is_active"] is False

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation)
def test_create_missing_pindora_reservations__in_the_past():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now - datetime.timedelta(days=1, hours=1),
        ends_at=now - datetime.timedelta(days=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value=pindora_reservation_response(access_code_is_active=True),
)
@patch_method(EmailService.send_reservation_access_type_changed_email)
def test_create_missing_pindora_reservations__ongoing():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now - datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.create_reservation.call_args.kwargs["is_active"] is True
    assert EmailService.send_reservation_access_type_changed_email.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation)
def test_create_missing_pindora_reservations__not_confirmed():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation)
def test_create_missing_pindora_reservations__not_access_code():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.UNRESTRICTED,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation)
def test_create_missing_pindora_reservations__already_generated():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=now,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == now
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value=pindora_reservation_response(access_code_is_active=False),
)
def test_create_missing_pindora_reservations__multiple():
    now = local_datetime()

    reservation_unit = ReservationUnitFactory.create(name="foo")

    reservation_1 = ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    reservation_2 = ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 2

    reservation_1.refresh_from_db()
    reservation_2.refresh_from_db()
    assert reservation_1.access_code_generated_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)
    assert reservation_2.access_code_generated_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation, side_effect=PindoraAPIError())
def test_create_missing_pindora_reservations__pindora_error():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation)
def test_create_missing_pindora_reservations__reservation_series_is_ignored():
    now = local_datetime()

    ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begins_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1, hours=1),
        reservation_series=ReservationSeriesFactory.create(),
    )

    create_missing_pindora_reservations_task()

    assert PindoraClient.create_reservation.call_count == 0
