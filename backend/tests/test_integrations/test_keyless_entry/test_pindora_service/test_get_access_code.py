from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.typing import (
    PindoraReservationInfoData,
    PindoraSectionInfoData,
    PindoraSeriesInfoData,
    PindoraValidityInfoData,
)
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, RecurringReservationFactory, ReservationFactory
from tests.helpers import ResponseMock, patch_method
from tests.test_integrations.test_keyless_entry.helpers import (
    default_reservation_response,
    default_reservation_series_response,
    default_seasonal_booking_response,
)

pytestmark = [
    pytest.mark.django_db,
]


def test_get_access_code__reservation():
    reservation = ReservationFactory.create(
        recurring_reservation=None,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_response(
        begin=reservation.begin.isoformat(),
        end=reservation.end.isoformat(),
        access_code_valid_minutes_before=10,
        access_code_valid_minutes_after=5,
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=reservation)

    assert response == PindoraReservationInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_begins_at=reservation.begin - datetime.timedelta(minutes=10),
        access_code_ends_at=reservation.end + datetime.timedelta(minutes=5),
    )


def test_get_access_code__reservation__in_series():
    series = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_series_response(
        reservation_unit_id=str(series.reservation_unit.uuid),
        reservation_unit_code_validity=[
            {
                "begin": reservation.begin.isoformat(),
                "end": reservation.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=reservation)

    assert response == PindoraReservationInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_begins_at=reservation.begin - datetime.timedelta(minutes=10),
        access_code_ends_at=reservation.end + datetime.timedelta(minutes=5),
    )


def test_get_access_code__reservation__in_series__pick_correct_reservation():
    series = RecurringReservationFactory.create()
    reservation_1 = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
    reservation_2 = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 2, 12),
        end=local_datetime(2024, 1, 2, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_series_response(
        reservation_unit_id=str(series.reservation_unit.uuid),
        reservation_unit_code_validity=[
            {
                "begin": reservation_1.begin.isoformat(),
                "end": reservation_1.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
            {
                "begin": reservation_2.begin.isoformat(),
                "end": reservation_2.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=reservation_1)

    assert response == PindoraReservationInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_begins_at=reservation_1.begin - datetime.timedelta(minutes=10),
        access_code_ends_at=reservation_1.end + datetime.timedelta(minutes=5),
    )


def test_get_access_code__reservation__in_series__in_seasonal_booking():
    section = ApplicationSectionFactory.create()
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_seasonal_booking_response(
        reservation_unit_code_validity=[
            {
                "reservation_unit_id": str(series.reservation_unit.uuid),
                "begin": reservation.begin.isoformat(),
                "end": reservation.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=reservation)

    assert response == PindoraReservationInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_begins_at=reservation.begin - datetime.timedelta(minutes=10),
        access_code_ends_at=reservation.end + datetime.timedelta(minutes=5),
    )


def test_get_access_code__series():
    series = RecurringReservationFactory.create()
    reservation = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_series_response(
        reservation_unit_id=str(series.reservation_unit.uuid),
        reservation_unit_code_validity=[
            {
                "begin": reservation.begin.isoformat(),
                "end": reservation.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=series)

    assert response == PindoraSeriesInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_validity=[
            PindoraValidityInfoData(
                reservation_id=reservation.pk,
                reservation_series_id=series.pk,
                access_code_begins_at=reservation.begin - datetime.timedelta(minutes=10),
                access_code_ends_at=reservation.end + datetime.timedelta(minutes=5),
            )
        ],
    )


def test_get_access_code__series__in_seasonal_booking():
    section = ApplicationSectionFactory.create()
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_seasonal_booking_response(
        reservation_unit_code_validity=[
            {
                "reservation_unit_id": str(series.reservation_unit.uuid),
                "begin": reservation.begin.isoformat(),
                "end": reservation.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=series)

    assert response == PindoraSeriesInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_validity=[
            PindoraValidityInfoData(
                reservation_id=reservation.pk,
                reservation_series_id=series.pk,
                access_code_begins_at=reservation.begin - datetime.timedelta(minutes=10),
                access_code_ends_at=reservation.end + datetime.timedelta(minutes=5),
            )
        ],
    )


def test_get_access_code__series__in_seasonal_booking__remove_other_series_values():
    section = ApplicationSectionFactory.create()

    series_1 = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        recurring_reservation=series_1,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    series_2 = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_2 = ReservationFactory.create(
        recurring_reservation=series_2,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_seasonal_booking_response(
        reservation_unit_code_validity=[
            {
                "reservation_unit_id": str(series_1.reservation_unit.uuid),
                "begin": reservation_1.begin.isoformat(),
                "end": reservation_1.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
            {
                "reservation_unit_id": str(series_2.reservation_unit.uuid),
                "begin": reservation_2.begin.isoformat(),
                "end": reservation_2.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=series_1)

    assert response == PindoraSeriesInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_validity=[
            PindoraValidityInfoData(
                reservation_id=reservation_1.pk,
                reservation_series_id=series_1.pk,
                access_code_begins_at=reservation_1.begin - datetime.timedelta(minutes=10),
                access_code_ends_at=reservation_1.end + datetime.timedelta(minutes=5),
            )
        ],
    )


def test_get_access_code__seasonal_booking():
    section = ApplicationSectionFactory.create()
    series = RecurringReservationFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        recurring_reservation=series,
        begin=local_datetime(2024, 1, 1, 12),
        end=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_seasonal_booking_response(
        reservation_unit_code_validity=[
            {
                "reservation_unit_id": str(series.reservation_unit.uuid),
                "begin": reservation.begin.isoformat(),
                "end": reservation.end.isoformat(),
                "access_code_valid_minutes_before": 10,
                "access_code_valid_minutes_after": 5,
            },
        ],
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.get_access_code(obj=section)

    assert response == PindoraSectionInfoData(
        access_code="13245#",
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
        access_code_keypad_url="https://keypad.test.ovaa.fi/hel/list/kannelmaen_leikkipuisto",
        access_code_phone_number="+358407089833",
        access_code_sms_number="+358407089834",
        access_code_sms_message="a13245",
        access_code_validity=[
            PindoraValidityInfoData(
                reservation_id=reservation.pk,
                reservation_series_id=series.pk,
                access_code_begins_at=reservation.begin - datetime.timedelta(minutes=10),
                access_code_ends_at=reservation.end + datetime.timedelta(minutes=5),
            )
        ],
    )
