import pytest

from applications.choices import WeekdayChoice
from applications.models import Address, ApplicationEvent, ApplicationEventSchedule, Organisation
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_update_application__single_field(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to update the application data
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application data is updated
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.additional_information == "bar"


def test_update_application__organisation__replace(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_organisation_pk = application.organisation.pk
    old_address_pk = application.organisation.address.pk

    # when:
    # - User tries to replace the application organisation
    input_data = {
        "pk": application.id,
        "organisation": {
            "name": "Hyper organisation",
            "address": {
                "streetAddress": "Testikatu 1",
                "postCode": "00001",
                "city": "Helsinki",
            },
        },
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The organisation has been updated
    # - The old organisation and its address still exist
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.organisation.pk != old_organisation_pk
    assert application.organisation.address.pk != old_address_pk
    assert Organisation.objects.filter(pk=old_organisation_pk).count() == 1
    assert Address.objects.filter(pk=old_address_pk).count() == 1


def test_update_application__organisation__use_existing(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_organisation_pk = application.organisation.pk
    old_address_pk = application.organisation.address.pk

    # when:
    # - User tries to use the same organisation
    input_data = {
        "pk": application.id,
        "organisation": {
            "pk": old_organisation_pk,
        },
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The organisation remains the same
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.organisation.pk == old_organisation_pk
    assert application.organisation.address.pk == old_address_pk


def test_update_application__organisation__modify_existing(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(organisation__name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_organisation_pk = application.organisation.pk
    old_address_pk = application.organisation.address.pk

    # when:
    # - User tries to modify an existing organisation
    input_data = {
        "pk": application.id,
        "organisation": {
            "pk": old_organisation_pk,
            "name": "bar",
        },
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The organisation remains the same, but the name is updated
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.organisation.pk == old_organisation_pk
    assert application.organisation.name == "bar"
    assert application.organisation.address.pk == old_address_pk


def test_update_application__organisation__not_deleted_if_not_given(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_organisation_pk = application.organisation.pk
    old_address_pk = application.organisation.address.pk

    # when:
    # - User tries to modify without specifying the organisation
    input_data = {
        "pk": application.id,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The organisation remains the same
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.organisation.pk == old_organisation_pk
    assert application.organisation.address.pk == old_address_pk


def test_update_application__organisation__deleted_if_none(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to remove the organisation
    input_data = {
        "pk": application.id,
        "organisation": None,
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The organisation has been removed
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.organisation is None


def test_update_application__application_events__replace(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    event = ApplicationEventFactory.create_in_status_unallocated(name="foo")
    application = event.application
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_event_pk = event.pk
    old_schedule_pk = schedule.pk

    # when:
    # - User tries to replace the application events
    input_data = {
        "pk": application.pk,
        "applicationEvents": [
            {
                "name": "foo",
                "applicationEventSchedules": [
                    {
                        "day": schedule.day,
                        "begin": schedule.begin.isoformat(),
                        "end": schedule.end.isoformat(),
                        "priority": schedule.priority,
                    },
                ],
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application event and schedule have been changed
    # - The old event and schedule do not exist anymore
    assert response.has_errors is False, response
    application.refresh_from_db()
    event: ApplicationEvent = application.application_events.first()
    assert event.pk != old_event_pk
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    assert schedule.pk != old_schedule_pk
    assert ApplicationEvent.objects.filter(pk=old_event_pk).count() == 0
    assert ApplicationEventSchedule.objects.filter(pk=old_schedule_pk).count() == 0


def test_update_application__application_events__use_existing(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    event = ApplicationEventFactory.create_in_status_unallocated()
    application = event.application
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_event_pk = event.pk
    old_schedule_pk = schedule.pk

    # when:
    # - User tries to use the same the application events and schedules
    input_data = {
        "pk": application.pk,
        "applicationEvents": [
            {
                "pk": old_event_pk,
                "applicationEventSchedules": [
                    {
                        "pk": old_schedule_pk,
                    },
                ],
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application event and schedule have not changed
    assert response.has_errors is False, response
    application.refresh_from_db()
    event: ApplicationEvent = application.application_events.first()
    assert event.pk == old_event_pk
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    assert schedule.pk == old_schedule_pk


def test_update_application__application_events__modify_existing(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    event = ApplicationEventFactory.create_in_status_unallocated(
        name="foo",
        application_event_schedules__day=WeekdayChoice.MONDAY,
    )
    application = event.application
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_event_pk = event.pk
    old_schedule_pk = schedule.pk

    # when:
    # - User tries to modify existing application events and schedules
    input_data = {
        "pk": application.pk,
        "applicationEvents": [
            {
                "pk": old_event_pk,
                "name": "bar",
                "applicationEventSchedules": [
                    {
                        "pk": old_schedule_pk,
                        "day": WeekdayChoice.TUESDAY.value,
                    },
                ],
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application event and schedule have not changed, but the name and day are updated
    assert response.has_errors is False, response
    application.refresh_from_db()
    event: ApplicationEvent = application.application_events.first()
    assert event.pk == old_event_pk
    assert event.name == "bar"
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    assert schedule.pk == old_schedule_pk
    assert schedule.day == WeekdayChoice.TUESDAY


def test_update_application__application_events__not_deleted_if_not_given(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    event = ApplicationEventFactory.create_in_status_unallocated(
        name="foo",
        application_event_schedules__day=WeekdayChoice.MONDAY,
    )
    application = event.application
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    old_event_pk = event.pk
    old_schedule_pk = schedule.pk

    # when:
    # - User tries to modify without specifying application events and schedules
    input_data = {
        "pk": application.pk,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application event and schedule have not changed
    assert response.has_errors is False, response
    application.refresh_from_db()
    event: ApplicationEvent = application.application_events.first()
    assert event.pk == old_event_pk
    schedule: ApplicationEventSchedule = event.application_event_schedules.first()
    assert schedule.pk == old_schedule_pk


def test_update_application__organisation__deleted_if_empty(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    event = ApplicationEventFactory.create_in_status_unallocated()
    application = event.application
    event.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to remove the application events and schedules
    input_data = {
        "pk": application.pk,
        "applicationEvents": [],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application event and schedule have been removed
    assert response.has_errors is False, response
    application.refresh_from_db()
    event: ApplicationEvent = application.application_events.first()
    assert event is None


def test_application_owner_cannot_update_own_application_after_application_period_over(graphql):
    # given:
    # - There an application round in allocation with a single application
    # - The application owner is using the system
    application = ApplicationFactory.create_in_status_in_allocation(additional_information="foo")
    graphql.force_login(application.user)

    input_data = {
        "pk": application.pk,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors
    assert response.field_error_messages() == ["No permission to mutate."]
