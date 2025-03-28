from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.tasks import create_missing_pindora_reservations
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import RecurringReservationFactory, ReservationFactory
from tests.helpers import patch_method


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value={
        "access_code_generated_at": datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        "access_code_is_active": True,
    },
)
@patch_method(EmailService.send_reservation_modified_email)
def test_create_missing_pindora_reservations__create_missing():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.create_reservation.call_args.kwargs["is_active"] is True
    assert EmailService.send_reservation_modified_email.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value={
        "access_code_generated_at": datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        "access_code_is_active": False,
    },
)
def test_create_missing_pindora_reservations__blocked():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

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
        begin=now - datetime.timedelta(days=1),
        end=now - datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value={
        "access_code_generated_at": datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        "access_code_is_active": True,
    },
)
@patch_method(EmailService.send_reservation_modified_email)
def test_create_missing_pindora_reservations__ongoing():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=now - datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.create_reservation.call_args.kwargs["is_active"] is True
    assert EmailService.send_reservation_modified_email.call_count == 1

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
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

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
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

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
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == now
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(
    PindoraClient.create_reservation,
    return_value={
        "access_code_generated_at": datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE),
        "access_code_is_active": False,
    },
)
def test_create_missing_pindora_reservations__multiple():
    now = local_datetime()

    ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 2


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
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at is None
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.create_reservation)
def test_create_missing_pindora_reservations__recurring_reservation_is_ignored():
    now = local_datetime()

    ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=None,
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
        recurring_reservation=RecurringReservationFactory.create(),
    )

    create_missing_pindora_reservations()

    assert PindoraClient.create_reservation.call_count == 0
