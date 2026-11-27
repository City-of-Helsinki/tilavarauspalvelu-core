from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import (
    AccessType,
    ReservationCancelReasonChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import ReservationStatistic
from utils.date_utils import local_date, local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationRoundFactory,
    ReservationPriceLineFactory,
    TaxLevelFactory,
    UserFactory,
)
from tests.helpers import as_mock, patch_method

from .helpers import CANCEL_SECTION_SERIES_MUTATION, create_reservation_series

if TYPE_CHECKING:
    from pytest_django import DjangoCaptureOnCommitCallbacks, Settings

    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_seasonal_booking_cancelled_all_email)
@patch_method(EmailService.send_seasonal_booking_cancelled_all_staff_notification_email)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__cancel_whole_remaining(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 5, "future": 5}
    assert reservation_series.reservations.count() == 9

    assert as_mock(EmailService.send_seasonal_booking_cancelled_all_email).called is True
    assert as_mock(EmailService.send_seasonal_booking_cancelled_all_staff_notification_email).called is True


@patch_method(EmailService.send_seasonal_booking_cancelled_all_email)
@patch_method(EmailService.send_seasonal_booking_cancelled_all_staff_notification_email)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__update_statistics(
    graphql: GraphQLClient, settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    settings.SAVE_RESERVATION_STATISTICS = True

    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )
    reservation_series.reservations.upsert_statistics()

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    }

    graphql.force_login(user)
    with django_capture_on_commit_callbacks(execute=True):
        response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    future_statistics = ReservationStatistic.objects.filter(begin__gt=local_datetime())
    past_statistics = ReservationStatistic.objects.filter(begin__lte=local_datetime())

    assert [statistic.state for statistic in future_statistics] == [ReservationStateChoice.CANCELLED] * 5
    assert [statistic.state for statistic in past_statistics] == [ReservationStateChoice.CONFIRMED] * 4


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__cancel_details_not_required(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 5, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__not_seasonal_type(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.NORMAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__paid(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    tax_level = TaxLevelFactory.create()
    for reservation in reservation_series.reservations.all():
        ReservationPriceLineFactory.create(reservation=reservation, tax_level=tax_level, amount=Decimal(10))

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.filter(state=ReservationStateChoice.CANCELLED).count() == 0


@patch_method(EmailService.send_seasonal_booking_cancelled_all_email)
@patch_method(EmailService.send_seasonal_booking_cancelled_all_staff_notification_email)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__only_free_reservations(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    free_dates = {datetime.date(2024, 1, 8), datetime.date(2024, 1, 22)}
    free_reservation_pks: set[int] = set()

    tax_level = TaxLevelFactory.create()
    for reservation in reservation_series.reservations.all():
        is_free = reservation.begins_at.date() in free_dates
        if is_free:
            free_reservation_pks.add(reservation.pk)

        ReservationPriceLineFactory.create(
            reservation=reservation,
            tax_level=tax_level,
            amount=Decimal(10),
            override_amount=Decimal(0) if is_free else None,
        )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 2, "future": 5}

    cancelled_reservations = reservation_series.reservations.filter(state=ReservationStateChoice.CANCELLED)
    assert set(cancelled_reservations.values_list("pk", flat=True)) == free_reservation_pks


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__not_confirmed_state(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__cancellation_rule(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(days=1),
    )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    # First future reservation is not cancelled since it's too soon according to the cancellation rule.
    assert response.first_query_object == {"cancelled": 4, "future": 5}
    assert reservation_series.reservations.count() == 9

    future_reservations = reservation_series.reservations.filter(begins_at__date__gte=local_date()).iterator()

    reservation_1 = next(future_reservations)
    assert reservation_1.begins_at.date() == datetime.date(2024, 1, 1)
    assert reservation_1.state == ReservationStateChoice.CONFIRMED

    reservation_2 = next(future_reservations)
    assert reservation_2.begins_at.date() == datetime.date(2024, 1, 8)
    assert reservation_2.state == ReservationStateChoice.CANCELLED


@patch_method(PindoraService.reschedule_access_code)
@patch_method(EmailService.send_seasonal_booking_cancelled_all_email)
@patch_method(EmailService.send_seasonal_booking_cancelled_all_staff_notification_email)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__access_codes(graphql: GraphQLClient) -> None:
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__access_type=AccessType.ACCESS_CODE,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(),
    )

    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__user=user,
        reservation_unit_option__application_section__application__application_round=application_round,
    )
    section = allocation.reservation_unit_option.application_section

    reservation_series.allocated_time_slot = allocation
    reservation_series.save()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert as_mock(PindoraService.reschedule_access_code).called is True
