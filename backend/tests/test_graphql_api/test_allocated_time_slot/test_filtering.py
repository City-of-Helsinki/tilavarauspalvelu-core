from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import (
    AccessCodeState,
    AccessType,
    ApplicationSectionStatusChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
    Weekday,
)
from utils.date_utils import local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationSectionFactory,
    ReservationFactory,
    ReservationSeriesFactory,
    ReservationUnitFactory,
    UnitGroupFactory,
)

from .helpers import allocations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__filter__by_pk(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create()
    AllocatedTimeSlotFactory.create()
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given pk
    query = allocations_query(pk=allocation.pk)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_pk__multiple(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation_1 = AllocatedTimeSlotFactory.create()
    allocation_2 = AllocatedTimeSlotFactory.create()
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given pk
    query = allocations_query(pk=[allocation_1.pk, allocation_2.pk])
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}


def test_allocated_time_slot__filter__by_application_round(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create()
    application_round = allocation.reservation_unit_option.application_section.application.application_round
    AllocatedTimeSlotFactory.create()
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given application round pk
    query = allocations_query(application_round=application_round.pk)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_application_section_status(graphql):
    # given:
    # - There are two allocated time slots in two application sections with different states
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_in_allocation(applied_reservations_per_week=2)
    section_2 = ApplicationSectionFactory.create_in_status_handled()
    option = section_1.reservation_unit_options.first()
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option=option)
    graphql.login_with_superuser()

    # Sanity check
    assert section_1.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_2.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - User tries to search allocations with the given application event status
    query = allocations_query(application_section_status=section_1.status)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_application_section_status__multiple(graphql):
    # given:
    # - There are two allocated time slots in two application sections with different states
    # - A superuser is using the system
    section_1 = ApplicationSectionFactory.create_in_status_in_allocation(applied_reservations_per_week=2)
    section_2 = ApplicationSectionFactory.create_in_status_handled()
    option_1 = section_1.reservation_unit_options.first()
    option_2 = section_2.reservation_unit_options.first()
    allocation_1 = AllocatedTimeSlotFactory.create(reservation_unit_option=option_1)
    allocation_2 = option_2.allocated_time_slots.first()
    graphql.login_with_superuser()

    # Sanity check
    assert section_1.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_2.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - User tries to search allocations with the given application event statuses
    query = allocations_query(application_section_status=[section_1.status, section_2.status])
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": allocation_2.pk}
    assert response.node(1) == {"pk": allocation_1.pk}


def test_allocated_time_slot__filter__by_applicant_type(graphql):
    # given:
    # - There are two allocated time slots with different applicant types
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__applicant_type=ReserveeType.INDIVIDUAL,
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__applicant_type=ReserveeType.COMPANY,
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given applicant type
    applicant_type = allocation.reservation_unit_option.application_section.application.applicant_type
    query = allocations_query(applicant_type=applicant_type)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_applicant_type__multiple(graphql):
    # given:
    # - There are two allocated time slots with different applicant types
    # - A superuser is using the system
    allocation_1 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__applicant_type=ReserveeType.INDIVIDUAL,
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__applicant_type=ReserveeType.COMPANY,
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given applicant types
    query = allocations_query(
        applicant_type=[
            allocation_1.reservation_unit_option.application_section.application.applicant_type,
            allocation_2.reservation_unit_option.application_section.application.applicant_type,
        ]
    )
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}


def test_allocated_time_slot__filter__by_allocated_unit(graphql):
    # given:
    # - There are two allocated time slots with different allocated units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_1)
    AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_2)
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated unit
    query = allocations_query(allocated_unit=reservation_unit_1.unit.pk)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_allocated_unit__multiple(graphql):
    # given:
    # - There are two allocated time slots with different allocated units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    allocation_1 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_1)
    allocation_2 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_2)
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated units
    query = allocations_query(allocated_unit=[reservation_unit_1.unit.pk, reservation_unit_2.unit.pk])
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}


def test_allocated_time_slot__filter__by_unit_group(graphql):
    # given:
    # - There are two allocated time slots with different allocated unit groups
    # - A superuser is using the system
    group_1 = UnitGroupFactory.create()
    group_2 = UnitGroupFactory.create()
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit__unit__unit_groups=[group_1])
    AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit__unit__unit_groups=[group_2])
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated unit group
    query = allocations_query(unit_group=[group_1.pk])
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_allocated_reservation_unit(graphql):
    # given:
    # - There are two allocated time slots with different allocated reservation units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_1)
    AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_2)
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated reservation unit
    query = allocations_query(allocated_reservation_unit=reservation_unit_1.pk)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_allocated_reservation_unit__multiple(graphql):
    # given:
    # - There are two allocated time slots with different allocated reservation units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    allocation_1 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_1)
    allocation_2 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit_2)
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated reservation unit
    query = allocations_query(allocated_reservation_unit=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}


def test_allocated_time_slot__filter__by_allocated_day(graphql):
    # given:
    # - There are two allocated time slots with different allocated day of the week
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create(day_of_the_week=Weekday.MONDAY)
    AllocatedTimeSlotFactory.create(day_of_the_week=Weekday.TUESDAY)
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated day
    query = allocations_query(day_of_the_week=allocation.day_of_the_week)
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__filter__by_allocated_day__multiple(graphql):
    # given:
    # - There are two allocated time slots with different allocated day of the week
    # - A superuser is using the system
    allocation_1 = AllocatedTimeSlotFactory.create(day_of_the_week=Weekday.MONDAY)
    allocation_2 = AllocatedTimeSlotFactory.create(day_of_the_week=Weekday.TUESDAY)
    graphql.login_with_superuser()

    # when:
    # - User tries to search allocations with the given allocated days
    query = allocations_query(day_of_the_week=[allocation_1.day_of_the_week, allocation_2.day_of_the_week])
    response = graphql(query)

    # then:
    # - The response contains the selected allocations
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}


def test_application__filter__by_text_search__section_id(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__application__id=1,
        reservation_unit_option__application_section__name="foo",
        reservation_unit_option__application_section__id=2,
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__application__id=3,
        reservation_unit_option__application_section__name="bar",
        reservation_unit_option__application_section__id=4,
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search=f"{allocation.reservation_unit_option.application_section.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": allocation.pk}


def test_application__filter__by_text_search__section_name(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name="bar",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": allocation.pk}


def test_application__filter__by_text_search__application_id(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__id=1,
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__id=3,
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__id=2,
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__id=4,
        reservation_unit_option__application_section__name="bar",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    application_id = allocation.reservation_unit_option.application_section.application.pk
    query = allocations_query(text_search=f"{application_id}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": allocation.pk}


def test_application__filter__by_text_search__applicant__organisation_name(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    allocation = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="foo",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="bar",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name=".",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": allocation.pk}


def test_application__filter__by_text_search__applicant__contact_person_first_name(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    schedule = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="foo",
        reservation_unit_option__application_section__application__contact_person_last_name="none",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="bar",
        reservation_unit_option__application_section__application__contact_person_last_name="none",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name=".",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__contact_person_last_name(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    schedule = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="none",
        reservation_unit_option__application_section__application__contact_person_last_name="foo",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="none",
        reservation_unit_option__application_section__application__contact_person_last_name="bar",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name=".",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__user_first_name(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    schedule = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="foo",
        reservation_unit_option__application_section__application__user__last_name="none",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="bar",
        reservation_unit_option__application_section__application__user__last_name="none",
        reservation_unit_option__application_section__name=".",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__user_last_name(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    schedule = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="none",
        reservation_unit_option__application_section__application__user__last_name="foo",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="none",
        reservation_unit_option__application_section__application__user__last_name="bar",
        reservation_unit_option__application_section__name=".",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__not_found(graphql):
    # given:
    # - There are two allocated time slots
    # - A superuser is using the system
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation_name="",
        reservation_unit_option__application_section__application__contact_person_first_name="",
        reservation_unit_option__application_section__application__contact_person_last_name="",
        reservation_unit_option__application_section__application__user__first_name="",
        reservation_unit_option__application_section__application__user__last_name="",
        reservation_unit_option__application_section__name="bar",
    )
    graphql.login_with_superuser()

    # when:
    # - User tries to filter allocated time slots with a text search
    query = allocations_query(text_search="not found")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right allocated time slot
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response


@pytest.mark.parametrize(
    "access_code_state",
    [
        AccessCodeState.ACCESS_CODE_NOT_REQUIRED,
        AccessCodeState.ACCESS_CODE_CREATED,
        AccessCodeState.ACCESS_CODE_PENDING,
    ],
)
def test_allocated_time_slot__filter__by_access_code_state(graphql, access_code_state):
    allocation_1 = AllocatedTimeSlotFactory.create()
    series_1 = ReservationSeriesFactory.create(allocated_time_slot=allocation_1)
    ReservationFactory.create(
        reservation_series=series_1,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    allocation_2 = AllocatedTimeSlotFactory.create()
    series_2 = ReservationSeriesFactory.create(allocated_time_slot=allocation_2)
    ReservationFactory.create(
        reservation_series=series_2,
        access_type=AccessType.UNRESTRICTED,
        access_code_is_active=False,
        access_code_generated_at=None,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    allocation_3 = AllocatedTimeSlotFactory.create()
    series_3 = ReservationSeriesFactory.create(allocated_time_slot=allocation_3)
    ReservationFactory.create(
        reservation_series=series_3,
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=False,
        access_code_generated_at=None,
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    allocation_map: dict[AccessCodeState, int] = {
        AccessCodeState.ACCESS_CODE_CREATED: allocation_1.pk,
        AccessCodeState.ACCESS_CODE_NOT_REQUIRED: allocation_2.pk,
        AccessCodeState.ACCESS_CODE_PENDING: allocation_3.pk,
    }

    graphql.login_with_superuser()
    query = allocations_query(access_code_state=access_code_state)
    response = graphql(query)

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation_map[access_code_state]}
