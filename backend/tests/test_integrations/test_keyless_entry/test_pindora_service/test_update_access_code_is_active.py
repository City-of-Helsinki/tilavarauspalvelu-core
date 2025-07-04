from __future__ import annotations

import uuid

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__active_when_should_be_inactive():
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is True
    assert PindoraService.deactivate_access_code.call_args.kwargs["obj"] == reservation


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__active_when_should_be_active():
    ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__inactive_when_should_be_active():
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.activate_access_code.call_args.kwargs["obj"] == reservation
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__inactive_when_should_be_inactive():
    ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code, side_effect=PindoraNotFoundError("not found"))
@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraNotFoundError("not found"))
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__not_found():
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is True
    assert PindoraService.deactivate_access_code.call_args.kwargs["obj"] == reservation

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__active_when_should_be_inactive():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is True
    assert PindoraService.deactivate_access_code.call_args.kwargs["obj"] == series


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__active_when_should_be_active():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__inactive_when_should_be_active():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.activate_access_code.call_args.kwargs["obj"] == series
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__inactive_when_should_be_inactive():
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code, side_effect=PindoraNotFoundError("not found"))
@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraNotFoundError("not found"))
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__not_found():
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is True
    assert PindoraService.deactivate_access_code.call_args.kwargs["obj"] == series

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__active_when_should_be_inactive():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(allocated_time_slot__reservation_unit_option__application_section=section)
    ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is True
    assert PindoraService.deactivate_access_code.call_args.kwargs["obj"] == section


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__active_when_should_be_active():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(allocated_time_slot__reservation_unit_option__application_section=section)
    ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__inactive_when_should_be_active():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(allocated_time_slot__reservation_unit_option__application_section=section)
    ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is True
    assert PindoraService.activate_access_code.call_args.kwargs["obj"] == section
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__inactive_when_should_be_inactive():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(allocated_time_slot__reservation_unit_option__application_section=section)
    ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is False


@patch_method(PindoraService.activate_access_code, side_effect=PindoraNotFoundError("not found"))
@patch_method(PindoraService.deactivate_access_code, side_effect=PindoraNotFoundError("not found"))
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__not_found():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(allocated_time_slot__reservation_unit_option__application_section=section)
    reservation = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    PindoraService.update_access_code_is_active()

    assert PindoraService.activate_access_code.called is False
    assert PindoraService.deactivate_access_code.called is True
    assert PindoraService.deactivate_access_code.call_args.kwargs["obj"] == section

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None
