from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.tasks import update_pindora_access_code_is_active
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory
from tests.helpers import patch_method


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    active_patch = patch_method(PindoraClient.activate_reservation_access_code)
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code)

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is True
    assert deactivate.called is False

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    active_patch = patch_method(PindoraClient.activate_reservation_access_code)
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code)

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is False
    assert deactivate.called is True

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    active_patch = patch_method(PindoraClient.activate_reservation_access_code)
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code)

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is False
    assert deactivate.called is False

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    active_patch = patch_method(PindoraClient.activate_reservation_access_code)
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code)

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is False
    assert deactivate.called is False

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    active_patch = patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraAPIError())
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraAPIError())

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is True
    assert deactivate.called is False

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    error = PindoraNotFoundError("error")
    active_patch = patch_method(PindoraClient.activate_reservation_access_code, side_effect=error)
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=error)

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is True
    assert deactivate.called is False

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    active_patch = patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraAPIError())
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraAPIError())

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is False
    assert deactivate.called is True

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True


@pytest.mark.django_db
@freeze_time("2023-01-01")
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

    error = PindoraNotFoundError("error")
    active_patch = patch_method(PindoraClient.activate_reservation_access_code, side_effect=error)
    deactivate_patch = patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=error)

    with active_patch as activate, deactivate_patch as deactivate:
        update_pindora_access_code_is_active()

    assert activate.called is False
    assert deactivate.called is True

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
