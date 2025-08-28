from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from utils.date_utils import local_datetime

from tests.factories import ApplicationSectionFactory, ReservationFactory, ReservationSeriesFactory, UserFactory
from tests.helpers import patch_method

from .helpers import REPAIR_ACCESS_CODE_SERIES_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationSeries

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.has_errors is False, response.errors

    assert response.results == {
        "accessCodeGeneratedAt": local_datetime(2024, 1, 1).astimezone(datetime.UTC).isoformat(),
        "accessCodeIsActive": True,
    }

    assert PindoraService.sync_access_code.call_count == 1


@patch_method(PindoraService.sync_access_code)
@patch_method(EmailService.send_seasonal_booking_access_type_changed_email)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__in_seasonal_booking(graphql):
    user = UserFactory.create()
    section = ApplicationSectionFactory.create(
        application__user=user,
    )
    series = ReservationSeriesFactory.create(
        user=user,
        allocated_time_slot__reservation_unit_option__application_section=section,
    )
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

    def hook(obj: ReservationSeries) -> None:
        obj.reservations.update(access_code_is_active=True)

    PindoraService.sync_access_code.side_effect = hook

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1

    # Since connected to seasonal booking, email should be sent.
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_count == 1
    assert EmailService.send_seasonal_booking_access_type_changed_email.call_args.args[0] == section


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__activate_if_inactive(graphql):
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.call_count == 1


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 2))
def test_repair_reservation_series_access_code__no_future_reservations(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.error_message(0) == "Last reservation in the series has already ended."


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__no_reservations(graphql):
    series = ReservationSeriesFactory.create()

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.error_message(0) == "Reservation series has no reservations."


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__not_using_access_codes(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
        reservation_unit=series.reservation_unit,
        reservation_series=series,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(2024, 1, 1),
    )

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.error_message(0) == ("Reservation series does not use access codes in any of its reservations.")


@patch_method(PindoraService.sync_access_code)
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__not_requiring_active_access_codes(graphql):
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.error_message(0) == "Reservation series should not have active access code."


@patch_method(PindoraService.sync_access_code, side_effect=PindoraAPIError("Pindora Error"))
@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_repair_reservation_series_access_code__pindora_call_fails(graphql):
    series = ReservationSeriesFactory.create()
    ReservationFactory.create(
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

    graphql.login_with_superuser()
    response = graphql(REPAIR_ACCESS_CODE_SERIES_MUTATION, variables={"input": {"pk": series.pk}})

    assert response.error_message(0) == "Pindora Error"

    assert PindoraService.sync_access_code.call_count == 1
