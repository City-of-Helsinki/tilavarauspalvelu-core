from unittest.mock import patch

import pytest

from applications.models import ApplicationEvent, ApplicationEventSchedule
from tests.factories import ApplicationFactory, ReservationUnitFactory, ServiceSectorFactory, UserFactory

from .helpers import APPROVE_MUTATION, mock_full_opening_hours

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_owner_cannot_approve_schedule(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - The application owner is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.force_login(application.user)

    # when:
    # - User tries to approve the application event schedule
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The error complains about permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_service_sector_admin_can_approve_schedule(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A service sector admin is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to approve the application event schedule
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    assert response.has_errors is False, response


def test_service_sector_admin_for_other_sector_cannot_approve_schedule(graphql):
    # given:
    # - There is an allocatable application event schedule
    # - A service sector admin for some other sector is using the system
    reservation_unit = ReservationUnitFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_events__event_reservation_units__reservation_unit=reservation_unit,
    )
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to approve the application event schedule
    input_data = {
        "pk": schedule.pk,
        "allocatedDay": schedule.day,
        "allocatedBegin": schedule.begin.isoformat(),
        "allocatedEnd": schedule.end.isoformat(),
        "allocatedReservationUnit": reservation_unit.pk,
    }
    with patch("actions.application_event_schedule.get_opening_hours", side_effect=mock_full_opening_hours):
        response = graphql(APPROVE_MUTATION, input_data=input_data)

    # then:
    # - The error complains about permissions
    assert response.field_error_messages() == ["No permission to mutate."]
