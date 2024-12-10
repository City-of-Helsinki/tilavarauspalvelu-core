from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from utils.date_utils import local_date, local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationRoundFactory,
    ReservationCancelReasonFactory,
    UserFactory,
)
from tests.helpers import patch_method

from .helpers import CANCEL_SECTION_SERIES_MUTATION, create_reservation_series

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_application_section_cancelled)
@patch_method(EmailService.send_staff_notification_application_section_cancelled)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__cancel_whole_remaining(graphql):
    reason = ReservationCancelReasonFactory.create()
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__price=0,
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
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 5, "future": 5}
    assert reservation_series.reservations.count() == 9

    assert EmailService.send_application_section_cancelled.called is True
    assert EmailService.send_staff_notification_application_section_cancelled.called is True


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__cancel_details_not_required(graphql):
    reason = ReservationCancelReasonFactory.create()
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__price=0,
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
        "cancelReason": reason.pk,
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 5, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__not_seasonal_type(graphql):
    reason = ReservationCancelReasonFactory.create()
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.NORMAL,
        reservations__price=0,
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
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__paid(graphql):
    reason = ReservationCancelReasonFactory.create()
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__price=10,
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
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__not_confirmed_state(graphql):
    reason = ReservationCancelReasonFactory.create()
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__state=ReservationStateChoice.REQUIRES_HANDLING,
        reservations__price=0,
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
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__cancellation_rule(graphql):
    reason = ReservationCancelReasonFactory.create()
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__price=0,
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
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    # First future reservation is not cancelled since it's too soon according to the cancellation rule.
    assert response.first_query_object == {"cancelled": 4, "future": 5}
    assert reservation_series.reservations.count() == 9

    future_reservations = reservation_series.reservations.filter(begin__date__gte=local_date()).iterator()

    reservation_1 = next(future_reservations)
    assert reservation_1.begin.date() == datetime.date(2024, 1, 1)
    assert reservation_1.state == ReservationStateChoice.CONFIRMED

    reservation_2 = next(future_reservations)
    assert reservation_2.begin.date() == datetime.date(2024, 1, 8)
    assert reservation_2.state == ReservationStateChoice.CANCELLED
