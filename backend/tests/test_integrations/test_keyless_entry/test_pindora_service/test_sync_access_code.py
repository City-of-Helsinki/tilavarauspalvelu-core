from __future__ import annotations

import uuid
from typing import Any

import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient, PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraConflictError, PindoraNotFoundError
from tilavarauspalvelu.integrations.keyless_entry.typing import PindoraAccessCodeModifyResponse
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]


def access_code_response(**kwargs: Any) -> PindoraAccessCodeModifyResponse:
    return PindoraAccessCodeModifyResponse(
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=kwargs["is_active"],
    )


@patch_method(PindoraService.delete_access_code)
@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(PindoraClient.reschedule_reservation, side_effect=access_code_response)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__generated(is_active):
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation.access_code_is_active is is_active

    assert PindoraService.delete_access_code.call_count == 0
    assert PindoraClient.create_reservation.call_count == 0
    assert PindoraClient.reschedule_reservation.call_count == 1


@patch_method(PindoraService.delete_access_code)
@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(PindoraClient.reschedule_reservation, side_effect=PindoraNotFoundError("Not found"))
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__generated__doesnt_exist(is_active):
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation.access_code_is_active is is_active

    assert PindoraService.delete_access_code.call_count == 0
    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.reschedule_reservation.call_count == 1


@patch_method(PindoraService.delete_access_code)
@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(PindoraClient.reschedule_reservation, side_effect=access_code_response)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__not_generated(is_active):
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation.access_code_is_active is is_active

    assert PindoraService.delete_access_code.call_count == 0
    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.reschedule_reservation.call_count == 0


@patch_method(PindoraService.delete_access_code)
@patch_method(PindoraClient.create_reservation, side_effect=PindoraConflictError("Conflict"))
@patch_method(PindoraClient.reschedule_reservation, side_effect=access_code_response)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__not_generated__already_exists(is_active):
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=None,
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    reservation.refresh_from_db()
    assert reservation.access_code_generated_at == local_datetime(2022, 1, 1)
    assert reservation.access_code_is_active is is_active

    assert PindoraService.delete_access_code.call_count == 0
    assert PindoraClient.create_reservation.call_count == 1
    assert PindoraClient.reschedule_reservation.call_count == 1


@patch_method(PindoraService.delete_access_code)
@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(PindoraClient.reschedule_reservation, side_effect=access_code_response)
def test_sync_access_code__reservation__not_access_code():
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.delete_access_code.call_count == 1
    assert PindoraClient.create_reservation.call_count == 0
    assert PindoraClient.reschedule_reservation.call_count == 0


@patch_method(PindoraService.delete_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(PindoraClient.reschedule_reservation, side_effect=access_code_response)
def test_sync_access_code__reservation__not_access_code__not_found():
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.delete_access_code.call_count == 1
    assert PindoraClient.create_reservation.call_count == 0
    assert PindoraClient.reschedule_reservation.call_count == 0


@patch_method(PindoraService.delete_access_code)
@patch_method(PindoraClient.create_reservation, side_effect=access_code_response)
@patch_method(PindoraClient.reschedule_reservation, side_effect=access_code_response)
@pytest.mark.parametrize("state", [ReservationStateChoice.DENIED, ReservationStateChoice.CANCELLED])
def test_sync_access_code__reservation__state_indicates_no_access_code(state):
    reservation = ReservationFactory.create(
        reservation_units__uuid=uuid.uuid4(),
        reservation_series=None,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        state=state,
        type=ReservationTypeChoice.NORMAL,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=True,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.delete_access_code.call_count == 1
    assert PindoraClient.create_reservation.call_count == 0
    assert PindoraClient.reschedule_reservation.call_count == 0


@patch_method(PindoraService.reschedule_access_code)
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__in_series(is_active):
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 0
    assert PindoraService.activate_access_code.call_count == (1 if is_active else 0)
    assert PindoraService.deactivate_access_code.call_count == (0 if is_active else 1)


@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__in_series__not_found(is_active):
    series = ReservationSeriesFactory.create()
    reservation = ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is is_active
    assert PindoraService.activate_access_code.call_count == 0
    assert PindoraService.deactivate_access_code.call_count == 0


@patch_method(PindoraService.reschedule_access_code)
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__in_series__in_seasonal_booking(is_active):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 0
    assert PindoraService.activate_access_code.call_count == (1 if is_active else 0)
    assert PindoraService.deactivate_access_code.call_count == (0 if is_active else 1)


@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__reservation__in_series__in_seasonal_booking__not_found(is_active):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    reservation = ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=reservation)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is is_active
    assert PindoraService.activate_access_code.call_count == 0
    assert PindoraService.deactivate_access_code.call_count == 0


@patch_method(PindoraService.reschedule_access_code)
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__series(is_active):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=series)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 0
    assert PindoraService.activate_access_code.call_count == (1 if is_active else 0)
    assert PindoraService.deactivate_access_code.call_count == (0 if is_active else 1)


@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__series__not_found(is_active):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=series)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is is_active
    assert PindoraService.activate_access_code.call_count == 0
    assert PindoraService.deactivate_access_code.call_count == 0


@patch_method(PindoraService.reschedule_access_code)
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__series__in_seasonal_booking(is_active):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=series)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 0
    assert PindoraService.activate_access_code.call_count == (1 if is_active else 0)
    assert PindoraService.deactivate_access_code.call_count == (0 if is_active else 1)


@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__series__in_seasonal_booking__not_found(is_active):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=series)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is is_active
    assert PindoraService.activate_access_code.call_count == 0
    assert PindoraService.deactivate_access_code.call_count == 0


@patch_method(PindoraService.reschedule_access_code)
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__seasonal_booking(is_active):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=section)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 0
    assert PindoraService.activate_access_code.call_count == (1 if is_active else 0)
    assert PindoraService.deactivate_access_code.call_count == (0 if is_active else 1)


@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraNotFoundError("Not found"))
@patch_method(PindoraService.create_access_code)
@patch_method(PindoraService.activate_access_code)
@patch_method(PindoraService.deactivate_access_code)
@pytest.mark.parametrize("is_active", [True, False])
def test_sync_access_code__seasonal_booking__not_found(is_active):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
    ReservationFactory.create(
        user=user,
        reservation_units=[series.reservation_unit],
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.ACCESS_CODE,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL if is_active else ReservationTypeChoice.BLOCKED,
        access_code_generated_at=local_datetime(2022, 1, 1),
        access_code_is_active=False,
    )

    PindoraService.sync_access_code(obj=section)

    assert PindoraService.reschedule_access_code.call_count == 1
    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is is_active
    assert PindoraService.activate_access_code.call_count == 0
    assert PindoraService.deactivate_access_code.call_count == 0
