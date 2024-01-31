import pytest

from applications.models import ApplicationEvent, ApplicationEventSchedule
from tests.factories import ApplicationFactory, ServiceSectorFactory, UserFactory

from .helpers import RESET_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_owner_cannot_reset_schedule(graphql):
    # given:
    # - There is a handled application event schedule
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_handled()
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.force_login(application.user)

    # when:
    # - User tries to reset the application event schedule
    response = graphql(RESET_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - The error complains about permissions
    assert response.field_error_messages() == ["No permission to mutate."]


def test_service_sector_admin_can_reset_schedule(graphql):
    # given:
    # - There is a handled application event schedule
    # - A service sector admin is using the system
    application = ApplicationFactory.create_in_status_handled()
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to reset the application event schedule
    response = graphql(RESET_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - There are no errors in the response
    assert response.has_errors is False, response


def test_service_sector_admin_for_other_sector_cannot_reset_schedule(graphql):
    # given:
    # - There is a handled application event schedule
    # - A service sector admin for some other sector is using the system
    application = ApplicationFactory.create_in_status_handled()
    event: ApplicationEvent = application.application_events.first()
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to reset the application event schedule
    response = graphql(RESET_MUTATION, input_data={"pk": schedule.pk})

    # then:
    # - The error complains about permissions
    assert response.field_error_messages() == ["No permission to mutate."]
