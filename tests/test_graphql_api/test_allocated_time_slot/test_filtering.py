import pytest

from tilavarauspalvelu.enums import ApplicantTypeChoice, ApplicationSectionStatusChoice, Weekday

from tests.factories import AllocatedTimeSlotFactory, ApplicationSectionFactory, ReservationUnitFactory

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
        reservation_unit_option__application_section__application__applicant_type=ApplicantTypeChoice.INDIVIDUAL,
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__applicant_type=ApplicantTypeChoice.COMPANY,
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
        reservation_unit_option__application_section__application__applicant_type=ApplicantTypeChoice.INDIVIDUAL,
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__applicant_type=ApplicantTypeChoice.COMPANY,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name="bar",
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__id=3,
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__id=2,
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
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
        reservation_unit_option__application_section__application__organisation__name="foo",
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation__name="bar",
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person__first_name="foo",
        reservation_unit_option__application_section__application__contact_person__last_name="none",
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person__first_name="bar",
        reservation_unit_option__application_section__application__contact_person__last_name="none",
        reservation_unit_option__application_section__application__user=None,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person__first_name="none",
        reservation_unit_option__application_section__application__contact_person__last_name="foo",
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person__first_name="none",
        reservation_unit_option__application_section__application__contact_person__last_name="bar",
        reservation_unit_option__application_section__application__user=None,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user__first_name="foo",
        reservation_unit_option__application_section__application__user__last_name="none",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user__first_name="none",
        reservation_unit_option__application_section__application__user__last_name="foo",
        reservation_unit_option__application_section__name=".",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
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
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
        reservation_unit_option__application_section__name="foo",
    )
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation=None,
        reservation_unit_option__application_section__application__contact_person=None,
        reservation_unit_option__application_section__application__user=None,
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
