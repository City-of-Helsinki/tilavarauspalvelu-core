from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationCancelReasonChoice, ReservationTypeChoice, UserRoleChoice
from utils.date_utils import local_datetime

from tests.factories import AllocatedTimeSlotFactory, ApplicationRoundFactory, UserFactory

from .helpers import CANCEL_SECTION_SERIES_MUTATION, create_reservation_series

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def create_section_for_cancellation() -> ApplicationSection:
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
    return section


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__applicant(graphql):
    section = create_section_for_cancellation()
    user = section.application.user

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__superuser(graphql):
    section = create_section_for_cancellation()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    graphql.login_with_superuser()
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to manage this application."


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_reservation_series__cancel_section_series__general_admin(graphql):
    section = create_section_for_cancellation()

    data = {
        "pk": section.pk,
        "cancelReason": ReservationCancelReasonChoice.CHANGE_OF_PLANS,
        "cancelDetails": "Cancellation details",
    }

    user = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)
    graphql.force_login(user)

    response = graphql(CANCEL_SECTION_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to manage this application."
