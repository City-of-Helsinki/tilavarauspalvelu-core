import pytest

from applications.enums import Weekday
from applications.models import Address, ApplicationSection, Organisation, SuitableTimeRange
from tests.factories import ApplicationFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_update_application__single_field(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(additional_information="foo")
    graphql.login_with_superuser()

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
    graphql.login_with_superuser()

    old_organisation_pk = application.organisation.pk
    old_address_pk = application.organisation.address.pk

    # when:
    # - User tries to replace the application organisation
    input_data = {
        "pk": application.id,
        "organisation": {
            "nameFi": "Hyper organisation",
            "address": {
                "streetAddressFi": "Testikatu 1",
                "postCode": "00001",
                "cityFi": "Helsinki",
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
    graphql.login_with_superuser()

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
    graphql.login_with_superuser()

    old_organisation_pk = application.organisation.pk
    old_address_pk = application.organisation.address.pk

    # when:
    # - User tries to modify an existing organisation
    input_data = {
        "pk": application.id,
        "organisation": {
            "pk": old_organisation_pk,
            "nameFi": "bar",
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
    graphql.login_with_superuser()

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
    graphql.login_with_superuser()

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


def test_update_application__application_sections__replace(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.MONDAY,
    )
    section = application.application_sections.first()
    suitable_time_range = section.suitable_time_ranges.first()
    graphql.login_with_superuser()

    old_section_pk = section.pk
    old_range_pk = suitable_time_range.pk

    # when:
    # - User tries to replace the application sections
    input_data = {
        "pk": application.pk,
        "applicationSections": [
            {
                "name": "foo",
                "numPersons": section.num_persons,
                "reservationsBeginDate": section.reservations_begin_date.isoformat(),
                "reservationsEndDate": section.reservations_end_date.isoformat(),
                "reservationMinDuration": int(section.reservation_min_duration.total_seconds()),
                "reservationMaxDuration": int(section.reservation_max_duration.total_seconds()),
                "appliedReservationsPerWeek": section.applied_reservations_per_week,
                "suitableTimeRanges": [
                    {
                        "priority": suitable_time_range.priority,
                        "dayOfTheWeek": suitable_time_range.day_of_the_week,
                        "beginTime": suitable_time_range.begin_time.isoformat(),
                        "endTime": suitable_time_range.end_time.isoformat(),
                    },
                ],
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application section and suitable time ranges have been changed
    # - The old section and ranges do not exist anymore
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section.pk != old_section_pk

    suitable = section.suitable_time_ranges.first()
    assert suitable.pk != old_range_pk

    assert ApplicationSection.objects.filter(pk=old_section_pk).count() == 0
    assert SuitableTimeRange.objects.filter(pk=old_range_pk).count() == 0


def test_update_application__application_sections__use_existing(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.MONDAY,
    )
    section = application.application_sections.first()
    suitable_time_range = section.suitable_time_ranges.first()
    graphql.login_with_superuser()

    old_section_pk = section.pk
    old_range_pk = suitable_time_range.pk

    # when:
    # - User tries to use the same the application sections and suitable time ranges
    input_data = {
        "pk": application.pk,
        "applicationSections": [
            {
                "pk": old_section_pk,
                "suitableTimeRanges": [
                    {
                        "pk": old_range_pk,
                    },
                ],
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application section sand suitable time ranges have not changed
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section.pk == old_section_pk

    suitable = section.suitable_time_ranges.first()
    assert suitable.pk == old_range_pk


def test_update_application__application_sections__modify_existing(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        application_sections__name="foo",
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.MONDAY,
    )
    section = application.application_sections.first()
    suitable_time_range = section.suitable_time_ranges.first()

    graphql.login_with_superuser()

    old_section_pk = section.pk
    old_range_pk = suitable_time_range.pk

    # when:
    # - User tries to modify existing application sections and suitable time ranges
    input_data = {
        "pk": application.pk,
        "applicationSections": [
            {
                "pk": old_section_pk,
                "name": "bar",
                "suitableTimeRanges": [
                    {
                        "pk": old_range_pk,
                        "dayOfTheWeek": Weekday.TUESDAY.value,
                    },
                ],
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application section and suitable time ranges have not changed, but the name and day are updated
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section.pk == old_section_pk
    assert section.name == "bar"

    suitable = section.suitable_time_ranges.first()
    assert suitable.pk == old_range_pk
    assert suitable.day_of_the_week == Weekday.TUESDAY


def test_update_application__application_sections__not_deleted_if_not_given(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        application_sections__suitable_time_ranges__day_of_the_week=Weekday.MONDAY,
    )
    section = application.application_sections.first()
    suitable_time_range = section.suitable_time_ranges.first()

    graphql.login_with_superuser()

    old_section_pk = section.pk
    old_range_pk = suitable_time_range.pk

    # when:
    # - User tries to modify without specifying application sections and suitable time ranges
    input_data = {
        "pk": application.pk,
        "additionalInformation": "bar",
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application sections and suitable time ranges have not changed
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section.pk == old_section_pk

    suitable = section.suitable_time_ranges.first()
    assert suitable.pk == old_range_pk


def test_update_application__organisation__deleted_if_empty(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    section = application.application_sections.first()
    graphql.login_with_superuser()

    # when:
    # - User tries to remove the application sections and suitable time ranges
    input_data = {
        "pk": application.pk,
        "applicationSections": [],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - The application sections and suitable time ranges have been removed
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section is None
