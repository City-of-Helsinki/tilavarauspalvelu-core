from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.tasks import update_pindora_access_code_is_active_task
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, ReservationSeriesFactory
from tests.helpers import patch_method


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(EmailService.send_reservation_access_code_added_email)
def test_update_pindora_access_code_is_active__activate():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0
    assert EmailService.send_reservation_access_code_added_email.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_update_pindora_access_code_is_active__deactivate():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_update_pindora_access_code_is_active__already_active():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_update_pindora_access_code_is_active__already_not_active():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraAPIError())
@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraAPIError())
def test_update_pindora_access_code_is_active__activate__pindora_error():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraNotFoundError("error"))
@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraNotFoundError("error"))
def test_update_pindora_access_code_is_active__activate__pindora_error__404():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraAPIError())
@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraAPIError())
def test_update_pindora_access_code_is_active__deactivate__pindora_error():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraNotFoundError("error"))
@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraNotFoundError("error"))
def test_update_pindora_access_code_is_active__deactivate__pindora_error__404():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 1

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
def test_update_pindora_access_code_is_active__reservation_series_is_ignored():
    now = local_datetime()

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
        begin=now + datetime.timedelta(days=1),
        end=now + datetime.timedelta(days=1, hours=1),
        reservation_series=ReservationSeriesFactory.create(),
    )

    update_pindora_access_code_is_active_task()

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
