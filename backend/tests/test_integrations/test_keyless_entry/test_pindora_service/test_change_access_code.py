from __future__ import annotations

import uuid

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import ResponseMock, patch_method
from tests.test_integrations.test_keyless_entry.helpers import default_access_code_modify_response

pytestmark = [
    pytest.mark.django_db,
]


def test_change_access_code__reservation():
    reservation = ReservationFactory.create(
        reservation_units__ext_uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.change_access_code(obj=reservation)

    assert response == PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation.access_code_is_active is True


def test_change_access_code__reservation__in_series():
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )
    reservation_2 = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.change_access_code(obj=reservation_1)

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


def test_change_access_code__reservation__in_series__in_seasonal_booking():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )
    reservation_2 = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.change_access_code(obj=reservation_1)

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


def test_change_access_code__series():
    series = ReservationSeriesFactory.create()
    reservation_1 = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )
    reservation_2 = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.change_access_code(obj=series)

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


def test_change_access_code__series__in_seasonal_booking():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )
    reservation_2 = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.change_access_code(obj=series)

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


def test_change_access_code__seasonal_booking():
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation_1 = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )
    reservation_2 = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    data = default_access_code_modify_response()

    with patch_method(PindoraClient.request, return_value=ResponseMock(json_data=data)):
        response = PindoraService.change_access_code(obj=section)

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
