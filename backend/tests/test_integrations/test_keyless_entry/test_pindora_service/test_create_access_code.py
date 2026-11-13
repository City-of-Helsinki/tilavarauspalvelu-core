from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import pytest
from auditlog.models import LogEntry

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraClientError
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationSectionFactory,
    ReservationFactory,
    ReservationSeriesFactory,
    UnitFactory,
    UserFactory,
)
from tests.helpers import ResponseMock, audit_log_enabled, exact, patch_method
from tests.test_integrations.test_keyless_entry.helpers import (
    default_reservation_response,
    default_reservation_series_response,
    default_seasonal_booking_response,
)

if TYPE_CHECKING:
    from pytest_django import Settings

pytestmark = [
    pytest.mark.django_db,
]


def test_create_access_code__reservation(settings: Settings) -> None:
    reservation = ReservationFactory.create(
        reservation_unit__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_reservation_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraService.create_access_code(obj=reservation, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation"


def test_create_access_code__reservation__in_series(settings: Settings) -> None:
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_series_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraService.create_access_code(obj=reservation_1, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_2.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series"


def test_create_access_code__reservation__in_series__in_seasonal_booking(settings: Settings) -> None:
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
    )

    data = default_seasonal_booking_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraService.create_access_code(obj=reservation_1, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_2.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/seasonal-booking"


def test_create_access_code__series(settings: Settings) -> None:
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )
    reservation_2 = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_series_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraService.create_access_code(obj=series, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_2.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/reservation-series"


def test_create_access_code__series__logs_access_code_info() -> None:
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    data = default_reservation_series_response()

    with (
        patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)),
        audit_log_enabled(Reservation),
    ):
        PindoraService.create_access_code(obj=series, is_active=True)

    log_entries = list(LogEntry.objects.get_for_object(reservation))
    assert [log_entry.changes for log_entry in log_entries] == [
        {"access_code_generated_at": ["None", "2021-12-31 22:00:00"], "access_code_is_active": ["False", "True"]},
    ]


def test_create_access_code__series__in_seasonal_booking(settings: Settings) -> None:
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
    )

    data = default_seasonal_booking_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraService.create_access_code(obj=series, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_2.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/seasonal-booking"


def test_create_access_code__seasonal_booking(settings: Settings) -> None:
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
    )

    data = default_seasonal_booking_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)) as patch:
        response = PindoraService.create_access_code(obj=section, is_active=True)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation_1.refresh_from_db()
    assert reservation_1.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_1.access_code_is_active is True

    reservation_2.refresh_from_db()
    assert reservation_2.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation_2.access_code_is_active is True

    assert patch.call_args.kwargs["method"] == "post"
    assert patch.call_args.kwargs["url"] == f"{settings.PINDORA_API_URL}/seasonal-booking"


def test_create_access_code__invalid_target() -> None:
    unit = UnitFactory.build(name="foo")

    msg = "Invalid create target: foo"
    with patch_method(PindoraClient.request) as patch, pytest.raises(PindoraClientError, match=exact(msg)):
        # The test passes an unsupported type on purpose.
        PindoraService.create_access_code(obj=unit)  # type: ignore[arg-type]

    assert patch.call_count == 0
