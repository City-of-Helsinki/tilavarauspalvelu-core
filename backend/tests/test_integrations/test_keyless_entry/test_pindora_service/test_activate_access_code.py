from __future__ import annotations

import uuid

import pytest
from rest_framework.status import HTTP_204_NO_CONTENT

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import ResponseMock, patch_method

pytestmark = [
    pytest.mark.django_db,
]


def test_activate_access_code__reservation(settings):
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=reservation)

    reservation.refresh_from_db()
    assert reservation.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation/activate/{reservation.ext_uuid}"


def test_activate_access_code__reservation__in_series(settings):
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_3 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 16),
        ends_at=local_datetime(2024, 1, 1, 17),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=reservation_1)

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_is_active is True

    reservation_3.refresh_from_db()
    assert reservation_3.access_code_is_active is False

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/activate/{series.ext_uuid}"


def test_activate_access_code__reservation__in_series__access_code_not_generated(settings):
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=None,
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=reservation_1)

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_is_active is False

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/activate/{series.ext_uuid}"


def test_activate_access_code__reservation__in_series__in_seasonal_booking(settings):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_2 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_3 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 16),
        ends_at=local_datetime(2024, 1, 1, 17),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=reservation_1)

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_is_active is True

    reservation_3.refresh_from_db()
    assert reservation_3.access_code_is_active is False

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/seasonal-booking/activate/{section.ext_uuid}"


def test_activate_access_code__series(settings):
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_3 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=series)

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_is_active is True

    reservation_3.refresh_from_db()
    assert reservation_3.access_code_is_active is False

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series/activate/{series.ext_uuid}"


def test_activate_access_code__series__in_seasonal_booking(settings):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_2 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_3 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=series)

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_is_active is True

    reservation_3.refresh_from_db()
    assert reservation_3.access_code_is_active is False

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/seasonal-booking/activate/{section.ext_uuid}"


def test_activate_access_code__seasonal_booking(settings):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_2 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=False,
        access_code_generated_at=local_datetime(),
    )
    reservation_3 = ReservationFactory.create(
        user=user,
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.BLOCKED,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    with patch_method(PindoraClient.request, return_value=ResponseMock(status_code=HTTP_204_NO_CONTENT)) as patch:
        PindoraService.activate_access_code(obj=section)

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_is_active is True

    reservation_3.refresh_from_db()
    assert reservation_3.access_code_is_active is False

    assert patch.call_args.kwargs["method"] == "put"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/seasonal-booking/activate/{section.ext_uuid}"
