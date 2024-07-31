from typing import TYPE_CHECKING

import pytest

from applications.enums import (
    ApplicantTypeChoice,
    ApplicationSectionStatusChoice,
    ApplicationStatusChoice,
    Priority,
    Weekday,
)
from tests.factories import (
    AgeGroupFactory,
    ApplicationFactory,
    ApplicationSectionFactory,
    CityFactory,
    ReservationPurposeFactory,
    SuitableTimeRangeFactory,
)
from tests.helpers import UserType
from tests.test_graphql_api.test_application_section.helpers import sections_query

if TYPE_CHECKING:
    from applications.models import ReservationUnitOption

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__filter__by_pk(graphql):
    # given:
    # - There is draft application in an open application round with two application sections
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section = ApplicationSectionFactory.create_in_status_unallocated(application=application)
    ApplicationSectionFactory.create_in_status_unallocated(application=application)
    graphql.force_login(application.user)

    # when:
    # - User tries to filter application sections with a primary key
    query = sections_query(pk=section.pk)
    response = graphql(query)

    # then:
    # - The response contains only the section with the given primary key
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section.pk}


def test_application_section__filter__by_pk__multiple(graphql):
    # given:
    # - There is draft application in an open application round with two application sections
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application)
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application=application)
    graphql.force_login(application.user)

    # when:
    # - User tries to filter application sections with a primary key
    query = sections_query(pk=[section_1.pk, section_2.pk])
    response = graphql(query)

    # then:
    # - The response contains only the section with the given primary key
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_name(graphql):
    # given:
    # - There is a draft application in an application round with three application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(name="foo", application=application)
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(name="foobar", application=application)
    ApplicationSectionFactory.create_in_status_unallocated(name="bar", application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections whose name starts with "foo"
    query = sections_query(name="foo")
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_application(graphql):
    # given:
    # - There are two draft application in the same application round with one application section each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections()
    application_2 = ApplicationFactory.create_in_status_draft_no_sections(
        application_round=application_1.application_round,
    )
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with an application primary key
    query = sections_query(application=application_1.pk)
    response = graphql(query)

    # then:
    # - The response contains only the section from the given application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_application_round(graphql):
    # given:
    # - There are two draft application in different application rounds with one application section each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections()
    application_2 = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with an application round primary key
    query = sections_query(application_round=application_1.application_round.pk)
    response = graphql(query)

    # then:
    # - The response contains only the section from the given application round
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_unit(graphql):
    # given:
    # - There is a draft application in an application round with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="foo",
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    section_reservation_unit: ReservationUnitOption = section_1.reservation_unit_options.first()

    # when:
    # - User tries to filter application sections with a specific unit
    query = sections_query(unit=section_reservation_unit.reservation_unit.unit.pk)
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_unit__multiple(graphql):
    # given:
    # - There is a draft application in an application round with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="foo",
    )
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    section_reservation_unit_1: ReservationUnitOption = section_1.reservation_unit_options.first()
    section_reservation_unit_2: ReservationUnitOption = section_2.reservation_unit_options.first()

    # when:
    # - User tries to filter application sections with any of the given units
    query = sections_query(
        unit=[
            section_reservation_unit_1.reservation_unit.unit.pk,
            section_reservation_unit_2.reservation_unit.unit.pk,
        ]
    )
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_reservation_unit(graphql):
    # given:
    # - There is a draft application in an application round with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="foo",
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    section_reservation_unit: ReservationUnitOption = section_1.reservation_unit_options.first()

    # when:
    # - User tries to filter application sections with a specific reservation unit
    query = sections_query(reservation_unit=section_reservation_unit.reservation_unit.pk)
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_reservation_unit__multiple(graphql):
    # given:
    # - There is a draft application in an application round with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="foo",
    )
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    section_reservation_unit_1: ReservationUnitOption = section_1.reservation_unit_options.first()
    section_reservation_unit_2: ReservationUnitOption = section_2.reservation_unit_options.first()

    # when:
    # - User tries to filter application sections with any of the given reservation units
    query = sections_query(
        reservation_unit=[
            section_reservation_unit_1.reservation_unit.pk,
            section_reservation_unit_2.reservation_unit.pk,
        ]
    )
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_user(graphql):
    # given:
    # - There is a draft application in an application round with three application sections
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections()
    application_2 = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific application owner
    query = sections_query(user=application_1.user.pk)
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_applicant_type(graphql):
    # given:
    # - There is a draft application in an application round with three application sections
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections(applicant_type=ApplicantTypeChoice.COMPANY)
    application_2 = ApplicationFactory.create_in_status_draft_no_sections(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections of a specific applicant type
    query = sections_query(applicant_type=ApplicantTypeChoice.COMPANY)
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_applicant_type__multiple(graphql):
    # given:
    # - There is a draft application in an application round with three application sections
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections(applicant_type=ApplicantTypeChoice.COMPANY)
    application_2 = ApplicationFactory.create_in_status_draft_no_sections(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with any of the given applicant types
    query = sections_query(applicant_type=[ApplicantTypeChoice.COMPANY, ApplicantTypeChoice.INDIVIDUAL])
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_status(graphql):
    # given:
    # - There is a draft application in an application round with two application sections with different statuses
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_in_allocation_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_in_allocation(application=application)
    section_2 = ApplicationSectionFactory.create_in_status_handled(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Sanity check
    assert section_1.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_2.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - User tries to filter application sections with a specific status
    query = sections_query(status=section_1.status)
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_status__multiple(graphql):
    # given:
    # - There is a draft application in an application round with two application sections with different statuses
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_in_allocation_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_in_allocation(application=application)
    section_2 = ApplicationSectionFactory.create_in_status_handled(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Sanity check
    assert section_1.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_2.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - User tries to filter application sections with a specific statuses
    query = sections_query(status=[section_1.status, section_2.status])
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_application_status(graphql):
    # given:
    # - There are two applications in different statuses in the same
    #   application round with one application section each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_in_allocation_no_sections()
    application_2 = ApplicationFactory.create_in_status_handled_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_in_allocation(application=application_1)
    section_2 = ApplicationSectionFactory.create_in_status_handled(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Sanity check
    assert application_1.status == ApplicationStatusChoice.IN_ALLOCATION
    assert application_2.status == ApplicationStatusChoice.HANDLED
    assert section_1.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_2.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - User tries to filter application sections with a specific status
    query = sections_query(application_status=application_1.status)
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_application_status__multiple(graphql):
    # given:
    # - There are two applications in different statuses in the same
    #   application round with one application section each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_in_allocation_no_sections()
    application_2 = ApplicationFactory.create_in_status_handled_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_in_allocation(application=application_1)
    section_2 = ApplicationSectionFactory.create_in_status_handled(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Sanity check
    assert application_1.status == ApplicationStatusChoice.IN_ALLOCATION
    assert application_2.status == ApplicationStatusChoice.HANDLED
    assert section_1.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_2.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - User tries to filter application sections with a specific statuses
    query = sections_query(application_status=[application_1.status, application_2.status])
    response = graphql(query)

    # then:
    # - The response contains the right application sections
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_priority(graphql):
    # given:
    # - There is a draft application with application sections with different priorities
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        suitable_time_ranges__priority=Priority.PRIMARY,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        suitable_time_ranges__priority=Priority.SECONDARY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific priority
    query = sections_query(priority=Priority.PRIMARY)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application section
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_priority__multiple(graphql):
    # given:
    # - There is a draft application with application sections with different priorities
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        suitable_time_ranges__priority=Priority.PRIMARY,
    )
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        suitable_time_ranges__priority=Priority.SECONDARY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific priorities
    query = sections_query(priority=[Priority.PRIMARY, Priority.SECONDARY])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__suitable_time_range_priority(graphql):
    # given:
    # - There is an application section with suitable time ranges of different priorities
    # - A superuser is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated()
    suitable_primary = SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        priority=Priority.PRIMARY,
    )
    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.TUESDAY,
        priority=Priority.SECONDARY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter suitable time ranges inside a section with a specific priority
    query = sections_query(
        fields="pk suitableTimeRanges { pk priority }",
        suitable_time_ranges__priority=Priority.PRIMARY,
    )
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application section with only the requested suitable time ranges
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0)["suitableTimeRanges"] == [
        {"pk": suitable_primary.pk, "priority": Priority.PRIMARY.value},
    ]


def test_application_section__filter__by_preferred_order(graphql):
    # given:
    # - There is a draft application with application sections with different preferred orders
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=1,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=2,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=3,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific preferred order
    query = sections_query(preferred_order=1)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application section
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_preferred_order__multiple(graphql):
    # given:
    # - There is a draft application with application sections with different preferred orders
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=1,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=2,
    )
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=3,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific preferred orders
    query = sections_query(preferred_order=[1, 3])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_include_preferred_order_10_or_higher(graphql):
    # given:
    # - There is a draft application with application sections with different preferred orders (some of which are 10+)
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=1,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=2,
    )
    section_3 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=10,
    )
    section_4 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=11,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a preferred order 10 or higher
    query = sections_query(include_preferred_order_10_or_higher=True)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_3.pk}
    assert response.node(1) == {"pk": section_4.pk}


def test_application_section__filter__by_include_preferred_order_10_or_higher__with_higher(graphql):
    # given:
    # - There is a draft application with application sections with different preferred orders (some of which are 10+)
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=1,
    )
    ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=2,
    )
    section_3 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=10,
    )
    section_4 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=11,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a preferred order 10 or higher, and a specific preferred order
    query = sections_query(preferred_order=1, include_preferred_order_10_or_higher=True)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application section
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_3.pk}
    assert response.node(2) == {"pk": section_4.pk}


def test_application_section__filter__by_home_city(graphql):
    # given:
    # - There are two application with different home cities, each with one application section
    # - A superuser is using the system
    city_1 = CityFactory.create(name="Helsinki")
    city_2 = CityFactory.create(name="Other")
    application_1 = ApplicationFactory.create_in_status_draft_no_sections(home_city=city_1)
    application_2 = ApplicationFactory.create_in_status_draft_no_sections(home_city=city_2)
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific preferred order
    query = sections_query(home_city=city_1.pk)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application section
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_home_city__multiple(graphql):
    # given:
    # - There are two application with different home cities, each with one application section
    # - A superuser is using the system
    city_1 = CityFactory.create(name="Helsinki")
    city_2 = CityFactory.create(name="Other")
    application_1 = ApplicationFactory.create_in_status_draft_no_sections(home_city=city_1)
    application_2 = ApplicationFactory.create_in_status_draft_no_sections(home_city=city_2)
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1)
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a specific preferred order
    query = sections_query(home_city=[city_1.pk, city_2.pk])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application section
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_age_group(graphql):
    # given:
    # - There is an application with two application sections with different age groups
    # - A superuser is using the system
    age_group_1 = AgeGroupFactory.create()
    age_group_2 = AgeGroupFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, age_group=age_group_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application, age_group=age_group_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a given age group
    query = sections_query(age_group=age_group_1.pk)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_age_group__multiple(graphql):
    # given:
    # - There is an application with two application sections with different age groups
    # - A superuser is using the system
    age_group_1 = AgeGroupFactory.create()
    age_group_2 = AgeGroupFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, age_group=age_group_1)
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application=application, age_group=age_group_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a given age groups
    query = sections_query(age_group=[age_group_1.pk, age_group_2.pk])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_purpose(graphql):
    # given:
    # - There is an application with two application sections with different reservation purposes
    # - A superuser is using the system
    purpose_1 = ReservationPurposeFactory.create()
    purpose_2 = ReservationPurposeFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, purpose=purpose_1)
    ApplicationSectionFactory.create_in_status_unallocated(application=application, purpose=purpose_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a given reservation purpose
    query = sections_query(purpose=purpose_1.pk)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_purpose__multiple(graphql):
    # given:
    # - There is an application with two application sections with different reservation purposes
    # - A superuser is using the system
    purpose_1 = ReservationPurposeFactory.create()
    purpose_2 = ReservationPurposeFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, purpose=purpose_1)
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(application=application, purpose=purpose_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a given reservation purpose
    query = sections_query(purpose=[purpose_1.pk, purpose_2.pk])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk}
    assert response.node(1) == {"pk": section_2.pk}


def test_application_section__filter__by_text_search__section_name(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person=None,
        user=None,
    )
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    ApplicationSectionFactory.create_in_status_unallocated(application=application, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_text_search__section_name__prefix(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None, contact_person=None, user=None
    )
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    ApplicationSectionFactory.create_in_status_unallocated(application=application, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search, which is only a prefix match
    query = sections_query(text_search="fo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_text_search__section_name__has_quotes(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None, contact_person=None, user=None
    )
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="Moe's Bar")
    ApplicationSectionFactory.create_in_status_unallocated(application=application, name="Bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search, which is only a partial match
    query = sections_query(text_search="Moe's")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_text_search__applicant__organisation_name(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation__name="fizz",
        contact_person=None,
        user=None,
    )
    section = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section.pk}


def test_application_section__filter__by_text_search__applicant__contact_person_first_name(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person__first_name="fizz",
        contact_person__last_name="none",
        user=None,
    )
    section = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section.pk}


def test_application_section__filter__by_text_search__applicant__contact_person_last_name(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person__first_name="none",
        contact_person__last_name="fizz",
        user=None,
    )
    section = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section.pk}


def test_application_section__filter__by_text_search__applicant__user_first_name(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person=None,
        user__first_name="fizz",
        user__last_name="none",
    )
    section = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section.pk}


def test_application_section__filter__by_text_search__applicant__user_last_name(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person=None,
        user__first_name="none",
        user__last_name="fizz",
    )
    section = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section.pk}


def test_application_section__filter__by_text_search__section_id(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person=None,
        user=None,
    )
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    ApplicationSectionFactory.create_in_status_unallocated(application=application, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search=f"{section_1.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_text_search__application_id(graphql):
    # given:
    # - There are two applications with one application sections each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person=None,
        user=None,
    )
    application_2 = ApplicationFactory.create_in_status_draft_no_sections(
        organisation=None,
        contact_person=None,
        user=None,
    )
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(application=application_1, name="foo")
    ApplicationSectionFactory.create_in_status_unallocated(application=application_2, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search=f"{application_1.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}


def test_application_section__filter__by_text_search__not_found(graphql):
    # given:
    # - There is an application with two application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections(
        organisation__name="org",
        contact_person__first_name="fizz",
        contact_person__last_name="buzz",
        user__first_name="person",
        user__last_name="one",
    )
    ApplicationSectionFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application sections with a text search
    query = sections_query(text_search="not found")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains no application sections
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response


def test_application_section__filter__reservation_unit_options__preferred_order(graphql):
    # given:
    # - There is draft application in an open application round with two application sections
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=0,
    )
    section_2 = ApplicationSectionFactory.create_in_status_unallocated(
        application=application,
        reservation_unit_options__preferred_order=1,
    )
    graphql.force_login(application.user)

    # when:
    # - User tries to filter only section reservation units with preferred order of 0
    fields = "pk reservationUnitOptions { preferredOrder }"
    query = sections_query(fields=fields, reservation_unit_options__preferred_order=0)
    response = graphql(query)

    # then:
    # - The response contains only the section reservation units with the given preferred order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": section_1.pk, "reservationUnitOptions": [{"preferredOrder": 0}]}
    assert response.node(1) == {"pk": section_2.pk, "reservationUnitOptions": []}


def test_application_section__filter__suitable_time_ranges__by_fulfilled(graphql):
    # given:
    # - There is an application section with an allocated time slot on Monday,
    #   and two suitable time ranges for Monday and Tuesday.
    # - A superuser is using the system
    section = ApplicationSectionFactory.create_in_status_unallocated(
        reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    time_range_1 = SuitableTimeRangeFactory.create(application_section=section, day_of_the_week=Weekday.MONDAY)
    time_range_2 = SuitableTimeRangeFactory.create(application_section=section, day_of_the_week=Weekday.TUESDAY)
    graphql.login_with_superuser()

    fields = """
        pk
        suitableTimeRanges {
            pk
            dayOfTheWeek
        }
    """

    # when:
    # - User tries to filter only to fulfilled suitable time ranges
    query = sections_query(fields=fields, suitable_time_ranges__fulfilled=True)
    response = graphql(query)

    # then:
    # - The response contains only the suitable time ranges that are fulfilled
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "pk": section.pk,
        "suitableTimeRanges": [
            {"pk": time_range_1.pk, "dayOfTheWeek": Weekday.MONDAY.value},
        ],
    }

    # when:
    # - User tries to filter only to unfulfilled suitable time ranges
    query = sections_query(fields=fields, suitable_time_ranges__fulfilled=False)
    response = graphql(query)

    # then:
    # - The response contains only the suitable time ranges that are not fulfilled
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "pk": section.pk,
        "suitableTimeRanges": [
            {"pk": time_range_2.pk, "dayOfTheWeek": Weekday.TUESDAY.value},
        ],
    }


def test_application_section__filter__by_has_allocations__true(graphql):
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_handled()

    assert section_1.allocations == 0
    assert section_2.allocations == 1

    graphql.login_with_superuser()
    query = sections_query(has_allocations=True)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_2.pk}


def test_application_section__filter__by_has_allocations__false(graphql):
    section_1 = ApplicationSectionFactory.create_in_status_unallocated()
    section_2 = ApplicationSectionFactory.create_in_status_handled()

    assert section_1.allocations == 0
    assert section_2.allocations == 1

    graphql.login_with_superuser()
    query = sections_query(has_allocations=False)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": section_1.pk}
