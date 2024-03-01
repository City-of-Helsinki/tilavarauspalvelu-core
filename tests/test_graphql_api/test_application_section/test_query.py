import pytest

from tests.factories import (
    ApplicationSectionFactory,
    SuitableTimeRangeFactory,
)
from tests.helpers import UserType
from tests.test_graphql_api.test_application_section.helpers import sections_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__query__all_fields(graphql):
    # given:
    # - There is draft application in an open application round
    # - A superuser is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated()
    option = section.reservation_unit_options.first()
    suitable_time_range = SuitableTimeRangeFactory.create(application_section=section)
    ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        name
        numPersons
        reservationsBeginDate
        reservationsEndDate
        reservationMinDuration
        reservationMaxDuration
        appliedReservationsPerWeek
        ageGroup {
            minimum
            maximum
        }
        purpose {
            nameFi
        }
        application {
            additionalInformation
        }
        reservationUnitOptions {
            pk
        }
        suitableTimeRanges {
            priority
            dayOfTheWeek
            beginTime
            endTime
            fulfilled
        }
        status
    """

    # when:
    # - User tries to search for application events with all fields
    query = sections_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains the selected fields from both application events
    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": section.pk,
        "name": section.name,
        "numPersons": section.num_persons,
        "reservationsBeginDate": section.reservations_begin_date.isoformat(),
        "reservationsEndDate": section.reservations_end_date.isoformat(),
        "reservationMinDuration": int(section.reservation_min_duration.total_seconds()),
        "reservationMaxDuration": int(section.reservation_max_duration.total_seconds()),
        "appliedReservationsPerWeek": section.applied_reservations_per_week,
        #
        "ageGroup": {
            "minimum": section.age_group.minimum,
            "maximum": section.age_group.maximum,
        },
        "purpose": {
            "nameFi": section.purpose.name_fi,
        },
        "application": {
            "additionalInformation": section.application.additional_information,
        },
        "reservationUnitOptions": [
            {
                "pk": option.pk,
            },
        ],
        "suitableTimeRanges": [
            {
                "priority": suitable_time_range.priority,
                "dayOfTheWeek": suitable_time_range.day_of_the_week,
                "beginTime": suitable_time_range.begin_time.isoformat(),
                "endTime": suitable_time_range.end_time.isoformat(),
                "fulfilled": suitable_time_range.fulfilled,
            },
        ],
        "status": section.status.value,
    }


def test_all_statuses(graphql):
    ApplicationSectionFactory.create_in_status_handled()
    ApplicationSectionFactory.create_in_status_in_allocation()
    ApplicationSectionFactory.create_in_status_unallocated()
    ApplicationSectionFactory.create_in_status_handled()
    ApplicationSectionFactory.create_in_status_in_allocation()
    ApplicationSectionFactory.create_in_status_unallocated()

    query = """
        query {
          applicationSections {
            edges {
              node {
                pk
                status
                application {
                  pk
                  status
                  applicationRound {
                    pk
                    status
                  }
                }
              }
            }
          }
        }
    """

    graphql.login_with_superuser()
    response = graphql(query)

    assert response.has_errors is False, response
    # (1 query for session, doesn't always happen for some reason)
    # 1 query for the user
    # 1 query to count application sections
    # 1 query to fetch application sections with their status annotations
    # 1 query to fetch applications with their status annotations
    # 1 query to fetch application rounds with their status annotations
    assert len(response.queries) in [5, 6], response.query_log
