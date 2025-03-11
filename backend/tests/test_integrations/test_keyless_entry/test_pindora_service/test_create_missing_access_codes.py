from __future__ import annotations

import uuid

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraConflictError
from tilavarauspalvelu.typing import (
    PindoraReservationInfoData,
    PindoraSectionInfoData,
    PindoraSeriesInfoData,
    PindoraValidityInfoData,
)
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, RecurringReservationFactory, ReservationFactory, UserFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation():
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        recurring_reservation=None,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.create_access_code.call_args.kwargs["obj"] == reservation
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is True


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__as_inactive():
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        recurring_reservation=None,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.create_access_code.call_args.kwargs["obj"] == reservation
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is False


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__not_confirmed():
    ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        recurring_reservation=None,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__already_generated():
    ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        recurring_reservation=None,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.create_access_code, side_effect=PindoraConflictError("conflict"))
@patch_method(
    PindoraService.get_access_code,
    return_value=PindoraReservationInfoData(
        access_code="1234",
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="1234",
        access_code_phone_number="1234",
        access_code_sms_number="1234",
        access_code_sms_message="1234",
        access_code_begins_at=local_datetime(2024, 1, 1, 12),
        access_code_ends_at=local_datetime(2024, 1, 1, 13),
    ),
)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__reservation__get_if_exists():
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        recurring_reservation=None,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.get_access_code.called is True
    assert PindoraService.get_access_code.call_args.kwargs["obj"] == reservation

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.create_access_code.call_args.kwargs["obj"] == series
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is True


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__as_inactive():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.create_access_code.call_args.kwargs["obj"] == series
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is False


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__not_confirmed():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__already_generated():
    series = RecurringReservationFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.create_access_code, side_effect=PindoraConflictError("conflict"))
@patch_method(
    PindoraService.get_access_code,
    return_value=PindoraSeriesInfoData(
        access_code="1234",
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="1234",
        access_code_phone_number="1234",
        access_code_sms_number="1234",
        access_code_sms_message="1234",
        access_code_validity=[
            PindoraValidityInfoData(
                reservation_id=0,
                reservation_series_id=0,
                access_code_begins_at=local_datetime(2024, 1, 1, 12),
                access_code_ends_at=local_datetime(2024, 1, 1, 13),
            ),
        ],
    ),
)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__series__get_if_exists():
    series = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.get_access_code.called is True
    assert PindoraService.get_access_code.call_args.kwargs["obj"] == series

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.create_access_code.call_args.kwargs["obj"] == section
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is True


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__as_inactive():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.create_access_code.call_args.kwargs["obj"] == section
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is False


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__not_confirmed():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.create_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__already_generated():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is False


@patch_method(PindoraService.create_access_code, side_effect=PindoraConflictError("conflict"))
@patch_method(
    PindoraService.get_access_code,
    return_value=PindoraSectionInfoData(
        access_code="1234",
        access_code_generated_at=local_datetime(2024, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="1234",
        access_code_phone_number="1234",
        access_code_sms_number="1234",
        access_code_sms_message="1234",
        access_code_validity=[
            PindoraValidityInfoData(
                reservation_id=0,
                reservation_series_id=0,
                access_code_begins_at=local_datetime(2024, 1, 1, 12),
                access_code_ends_at=local_datetime(2024, 1, 1, 13),
            ),
        ],
    ),
)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_create_missing_access_codes__seasonal_booking__get_if_exists():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    PindoraService.create_missing_access_codes()

    assert PindoraService.create_access_code.called is True
    assert PindoraService.get_access_code.called is True
    assert PindoraService.get_access_code.call_args.kwargs["obj"] == section

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2024, 1, 1)
    assert reservation.access_code_is_active is True
