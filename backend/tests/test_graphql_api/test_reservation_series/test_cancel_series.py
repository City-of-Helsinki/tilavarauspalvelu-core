from __future__ import annotations

import datetime

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
from utils.date_utils import local_date, local_datetime

from tests.factories import AllocatedTimeSlotFactory, ApplicationRoundFactory, UserFactory
from tests.helpers import patch_method

from .helpers import CANCEL_SECTION_SERIES_MUTATION, create_reservation_series

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_seasonal_booking_cancelled_all_email)
@patch_method(EmailService.send_seasonal_booking_cancelled_all_staff_notification_email)
@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__cancel_whole_remaining(graphql):
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert response.results == {"cancelled": 5, "future": 5}
    assert reservation_series.reservations.count() == 9

    assert EmailService.send_seasonal_booking_cancelled_all_email.called is True
    assert EmailService.send_seasonal_booking_cancelled_all_staff_notification_email.called is True


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__cancel_details_not_required(graphql):
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert response.results == {"cancelled": 5, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__not_seasonal_type(graphql):
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert response.results == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__paid(graphql):
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert response.results == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__not_confirmed_state(graphql):
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert response.results == {"cancelled": 0, "future": 5}
    assert reservation_series.reservations.count() == 9


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__cancellation_rule(graphql):
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    # First future reservation is not cancelled since it's too soon according to the cancellation rule.
    assert response.results == {"cancelled": 4, "future": 5}
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
def test_reservation_series__cancel_section_series__access_codes(graphql):
    user = UserFactory.create()

    reservation_series = create_reservation_series(
        user=user,
        reservations__access_type=AccessType.ACCESS_CODE,
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
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.reschedule_access_code.called is True
