from __future__ import annotations

import uuid

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def modify_response(*, is_active: bool) -> PindoraAccessCodeModifyResponse:
    return PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=is_active,
    )


# ── Reservation ──


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(EmailService.send_reservation_access_type_changed_email)
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

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_args.args == (reservation,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(EmailService.send_reservation_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__active_when_should_be_active():
    reservation = ReservationFactory.create(
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

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(EmailService.send_reservation_access_type_changed_email)
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

    assert PindoraClient.activate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0
    assert PindoraClient.activate_reservation_access_code.call_args.args == (reservation,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_reservation_access_type_changed_email.call_count == 1
    assert EmailService.send_reservation_access_type_changed_email.call_args.kwargs == {"reservation": reservation}


@patch_method(PindoraClient.activate_reservation_access_code)
@patch_method(PindoraClient.deactivate_reservation_access_code)
@patch_method(EmailService.send_reservation_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__reservation__inactive_when_should_be_inactive():
    reservation = ReservationFactory.create(
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

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.activate_reservation_access_code, side_effect=PindoraNotFoundError("not found"))
@patch_method(PindoraClient.deactivate_reservation_access_code, side_effect=PindoraNotFoundError("not found"))
@patch_method(EmailService.send_reservation_access_type_changed_email)
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

    assert PindoraClient.activate_reservation_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_access_code.call_args.args == (reservation,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None

    assert EmailService.send_reservation_access_type_changed_email.call_count == 0


# ── Reservation series ──


@patch_method(PindoraClient.reschedule_reservation_series, return_value=modify_response(is_active=True))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__active_when_should_be_inactive():
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

    assert PindoraClient.reschedule_reservation_series.call_count == 1
    assert PindoraClient.activate_reservation_series_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 1
    assert PindoraClient.reschedule_reservation_series.call_args.args == (series,)
    assert PindoraClient.deactivate_reservation_series_access_code.call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None


@patch_method(PindoraClient.reschedule_reservation_series, return_value=modify_response(is_active=False))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__active_when_should_be_inactive__already_inactive_in_pindora():
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

    assert PindoraClient.reschedule_reservation_series.call_count == 1
    assert PindoraClient.activate_reservation_series_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 0
    assert PindoraClient.reschedule_reservation_series.call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None


@patch_method(PindoraClient.reschedule_reservation_series)
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__active_when_should_be_active():
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_reservation_series.call_count == 0
    assert PindoraClient.activate_reservation_series_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)


@patch_method(PindoraClient.reschedule_reservation_series, return_value=modify_response(is_active=False))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__inactive_when_should_be_active():
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_reservation_series.call_count == 1
    assert PindoraClient.activate_reservation_series_access_code.call_count == 1
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 0
    assert PindoraClient.reschedule_reservation_series.call_args.args == (series,)
    assert PindoraClient.activate_reservation_series_access_code.call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)


@patch_method(PindoraClient.reschedule_reservation_series, return_value=modify_response(is_active=True))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__inactive_when_should_be_active__already_active_in_pindora():
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_reservation_series.call_count == 1
    assert PindoraClient.activate_reservation_series_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 0
    assert PindoraClient.reschedule_reservation_series.call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)


@patch_method(PindoraClient.reschedule_reservation_series)
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__series__inactive_when_should_be_inactive():
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_reservation_series.call_count == 0
    assert PindoraClient.activate_reservation_series_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)


@patch_method(PindoraClient.reschedule_reservation_series, side_effect=PindoraNotFoundError("not found"))
@patch_method(PindoraClient.activate_reservation_series_access_code)
@patch_method(PindoraClient.deactivate_reservation_series_access_code)
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

    assert PindoraClient.reschedule_reservation_series.call_count == 1
    assert PindoraClient.activate_reservation_series_access_code.call_count == 0
    assert PindoraClient.deactivate_reservation_series_access_code.call_count == 0
    assert PindoraClient.reschedule_reservation_series.call_args.args == (series,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None


# ── Seasonal booking ──


@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=modify_response(is_active=True))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__active_when_should_be_inactive():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 1
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 1
    assert PindoraClient.reschedule_seasonal_booking.call_args.args == (section,)
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=modify_response(is_active=False))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__active_when_should_be_inactive__already_inactive_in_pindora():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 1
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.reschedule_seasonal_booking.call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.reschedule_seasonal_booking)
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__active_when_should_be_active():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 0
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=modify_response(is_active=False))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__inactive_when_should_be_active():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 1
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 1
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.reschedule_seasonal_booking.call_args.args == (section,)
    assert PindoraClient.activate_seasonal_booking_access_code.call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 1
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_args.args == (section,)


@patch_method(PindoraClient.reschedule_seasonal_booking, return_value=modify_response(is_active=True))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__inactive_when_should_be_active__already_active_in_pindora():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 1
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.reschedule_seasonal_booking.call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.reschedule_seasonal_booking)
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__inactive_when_should_be_inactive():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 0
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 0

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0


@patch_method(PindoraClient.reschedule_seasonal_booking, side_effect=PindoraNotFoundError("not found"))
@patch_method(PindoraClient.activate_seasonal_booking_access_code)
@patch_method(PindoraClient.deactivate_seasonal_booking_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_update_access_code_is_active__seasonal_booking__not_found():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
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

    assert PindoraClient.reschedule_seasonal_booking.call_count == 1
    assert PindoraClient.activate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.deactivate_seasonal_booking_access_code.call_count == 0
    assert PindoraClient.reschedule_seasonal_booking.call_args.args == (section,)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None

    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 0
