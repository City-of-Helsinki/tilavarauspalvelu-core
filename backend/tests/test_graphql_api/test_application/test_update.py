from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import ApplicationSection, SuitableTimeRange
from utils.date_utils import local_date

from tests.factories import ApplicationFactory, ApplicationRoundFactory

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
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response contains no errors
    # - The application data is updated
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.additional_information == "bar"


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
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

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
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response contains no errors
    # - The application sections and suitable time ranges have not changed
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section.pk == old_section_pk

    suitable = section.suitable_time_ranges.first()
    assert suitable.pk == old_range_pk


def test_update_application__application_sections__deleted_if_empty(graphql):
    # given:
    # - There is a draft application in an open application round
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    # when:
    # - User tries to remove the application sections and suitable time ranges
    input_data = {
        "pk": application.pk,
        "applicationSections": [],
    }
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # then:
    # - The response contains no errors
    # - The application sections and suitable time ranges have been removed
    assert response.has_errors is False, response

    section = application.application_sections.first()
    assert section is None


def test_update_application__user(graphql):
    application = ApplicationFactory.create_in_status_draft()
    user = graphql.login_with_superuser()

    input_data = {
        "pk": application.id,
        "user": user.pk,
    }
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # User cannot be updated
    assert response.has_errors is True, response


def test_update_application__application_round(graphql):
    application_round = ApplicationRoundFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    input_data = {
        "pk": application.id,
        "application_round": application_round.pk,
    }
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # Application round cannot be updated
    assert response.has_errors is True, response


def test_update_application__sent_at(graphql):
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    input_data = {
        "pk": application.id,
        "sentAt": local_date().isoformat(),
    }
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # Sent date cannot be updated, must use specific mutation
    assert response.has_errors is True, response


def test_update_application__working_memo(graphql):
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    input_data = {
        "pk": application.id,
        "workingMemo": "foo",
    }
    response = graphql(UPDATE_MUTATION, variables={"input": input_data})

    # Working memo cannot be updated, must use specific mutation
    assert response.has_errors is True, response
