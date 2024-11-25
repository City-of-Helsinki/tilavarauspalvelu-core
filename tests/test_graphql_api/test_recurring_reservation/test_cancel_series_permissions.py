import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationTypeChoice, UserRoleChoice
from tilavarauspalvelu.models import ApplicationSection, ReservationCancelReason, User
from utils.date_utils import local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationRoundFactory,
    ReservationCancelReasonFactory,
    UserFactory,
)

from .helpers import CANCEL_SECTION_SERIES_MUTATION, create_reservation_series

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def create_data_for_cancellation() -> tuple[ReservationCancelReason, ApplicationSection, User]:
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
    return reason, section, user


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__applicant(graphql):
    reason, section, user = create_data_for_cancellation()

    data = {
        "pk": section.pk,
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.force_login(user)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__superuser(graphql):
    reason, section, _ = create_data_for_cancellation()

    data = {
        "pk": section.pk,
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.login_with_superuser()
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


@freeze_time(local_datetime(year=2024, month=1, day=1))
def test_recurring_reservations__cancel_section_series__general_admin(graphql):
    reason, section, _ = create_data_for_cancellation()

    data = {
        "pk": section.pk,
        "cancelReason": reason.pk,
        "cancelDetails": "Cancellation details",
    }

    graphql.login_user_with_role(UserRoleChoice.ADMIN)
    response = graphql(CANCEL_SECTION_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
