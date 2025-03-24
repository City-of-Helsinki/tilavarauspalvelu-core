from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.keyless_entry.service import PindoraService
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime

from tests.factories import ReservationUnitAccessTypeFactory
from tests.helpers import patch_method

from .helpers import ADD_RESERVATION_TO_SERIES_MUTATION, create_reservation_series, get_minimal_add_data

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

pytestmark = [
    pytest.mark.django_db,
]


@freeze_time(local_datetime(2024, 1, 1))
def test_recurring_reservations__add_reservation(graphql):
    series = create_reservation_series()

    assert series.reservations.count() == 9

    data = get_minimal_add_data(series)

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert series.reservations.count() == 10


@freeze_time(local_datetime(2024, 1, 1))
def test_recurring_reservations__add_reservation__overlapping(graphql):
    series = create_reservation_series()

    assert series.reservations.count() == 9

    data = get_minimal_add_data(
        series,
        begin=datetime.datetime(2024, 1, 1, 10, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        end=datetime.datetime(2024, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    assert series.reservations.count() == 9


@freeze_time(local_datetime(2024, 1, 1))
def test_recurring_reservations__add_reservation__begin_after_end(graphql):
    series = create_reservation_series()

    assert series.reservations.count() == 9

    data = get_minimal_add_data(
        series,
        begin=datetime.datetime(2024, 1, 2, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        end=datetime.datetime(2024, 1, 2, 10, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot end before it begins"]

    assert series.reservations.count() == 9


@freeze_time(local_datetime(2024, 1, 1))
@patch_method(PindoraService.reschedule_access_code)
def test_recurring_reservations__add_reservation__access_code(graphql):
    series = create_reservation_series(
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
        reservations__access_type=AccessType.ACCESS_CODE,
        reservations__access_code_is_active=True,
        reservations__access_code_generated_at=local_datetime(2024, 1, 1),
    )

    assert series.reservations.count() == 9
    existing = list(series.reservations.values_list("pk", flat=True))

    data = get_minimal_add_data(series)

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert series.reservations.count() == 10
    new_reservation: Reservation | None = series.reservations.exclude(pk__in=existing).first()

    assert new_reservation is not None

    assert new_reservation.access_type == AccessType.ACCESS_CODE

    # These are the default, would be updated by rescheduling, but we mocked it out.
    assert new_reservation.access_code_is_active is False
    assert new_reservation.access_code_generated_at is None

    assert PindoraService.reschedule_access_code.called is True


@freeze_time(local_datetime(2024, 1, 1))
@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraNotFoundError("Not Found"))
@patch_method(PindoraService.create_access_code)
def test_recurring_reservations__add_reservation__access_code__create_if_not_found(graphql):
    series = create_reservation_series(
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
        reservations__access_type=AccessType.ACCESS_CODE,
        reservations__access_code_is_active=True,
        reservations__access_code_generated_at=local_datetime(2024, 1, 1),
    )

    assert series.reservations.count() == 9
    existing = list(series.reservations.values_list("pk", flat=True))

    data = get_minimal_add_data(series)

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert series.reservations.count() == 10
    new_reservation: Reservation | None = series.reservations.exclude(pk__in=existing).first()

    assert new_reservation is not None

    assert new_reservation.access_type == AccessType.ACCESS_CODE

    # These are the default, will be updated in the background task, since the rescheduling failed.
    assert new_reservation.access_code_is_active is False
    assert new_reservation.access_code_generated_at is None

    # Since rescheduling found no access code, we create new one.
    assert PindoraService.reschedule_access_code.called is True
    assert PindoraService.create_access_code.called is True


@freeze_time(local_datetime(2024, 1, 1))
@patch_method(PindoraService.reschedule_access_code, side_effect=PindoraAPIError("Failed"))
@patch_method(PindoraService.create_access_code)
def test_recurring_reservations__add_reservation__access_code__failed_pindora_call(graphql):
    series = create_reservation_series(
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
        reservations__access_type=AccessType.ACCESS_CODE,
        reservations__access_code_is_active=True,
        reservations__access_code_generated_at=local_datetime(2024, 1, 1),
    )

    assert series.reservations.count() == 9
    existing = list(series.reservations.values_list("pk", flat=True))

    data = get_minimal_add_data(series)

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert series.reservations.count() == 10
    new_reservation: Reservation | None = series.reservations.exclude(pk__in=existing).first()

    assert new_reservation is not None

    assert new_reservation.access_type == AccessType.ACCESS_CODE

    # These are the default, will be updated in the background task, since the rescheduling failed.
    assert new_reservation.access_code_is_active is False
    assert new_reservation.access_code_generated_at is None

    # Since rescheduling failed unexpectedly, we don't call create_access_code, but don't fail either.
    assert PindoraService.reschedule_access_code.called is True
    assert PindoraService.create_access_code.called is False


@freeze_time(local_datetime(2024, 1, 1))
@patch_method(PindoraService.reschedule_access_code)
def test_recurring_reservations__add_reservation__new_one_is_not_access_code(graphql):
    series = create_reservation_series(
        reservations__access_type=AccessType.ACCESS_CODE,
        reservations__access_code_is_active=True,
        reservations__access_code_generated_at=local_datetime(2024, 1, 1),
    )

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=series.reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=local_date(2023, 1, 1),
    )

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=series.reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=local_date(2024, 1, 1),
    )

    assert series.reservations.count() == 9
    existing = list(series.reservations.values_list("pk", flat=True))

    data = get_minimal_add_data(series)

    graphql.login_with_superuser()
    response = graphql(ADD_RESERVATION_TO_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    assert series.reservations.count() == 10
    new_reservation: Reservation | None = series.reservations.exclude(pk__in=existing).first()

    assert new_reservation is not None

    assert new_reservation.access_type == AccessType.PHYSICAL_KEY
    assert new_reservation.access_code_is_active is False
    assert new_reservation.access_code_generated_at is None

    # No need to call Pindora if this reservation doesn't add an access code.
    assert PindoraService.reschedule_access_code.called is False
