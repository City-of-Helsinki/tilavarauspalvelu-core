import datetime

import pytest
from django.utils.timezone import get_default_timezone

from tests.factories import AllocatedTimeSlotFactory, ApplicationFactory, ApplicationSectionFactory
from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, ApplicationStatusChoice, Weekday

from .helpers import allocations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    ("field", "order"),
    [
        ("pkAsc", [1, 2, 3]),
        ("pkDesc", [3, 2, 1]),
        ("applicationSectionPkAsc", [1, 2, 3]),
        ("applicationSectionPkDesc", [3, 2, 1]),
        ("applicationPkAsc", [1, 2, 3]),
        ("applicationPkDesc", [3, 2, 1]),
    ],
)
def test_allocated_time_slot__order__by_ids(graphql, field, order):
    # given:
    # - There are three allocated time slots
    schedules = {
        1: AllocatedTimeSlotFactory.create(),
        2: AllocatedTimeSlotFactory.create(),
        3: AllocatedTimeSlotFactory.create(),
    }
    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots in the given order
    query = allocations_query(order_by=field)
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    ordering = iter(order)
    assert response.node(0) == {"pk": schedules[next(ordering)].pk}
    assert response.node(1) == {"pk": schedules[next(ordering)].pk}
    assert response.node(2) == {"pk": schedules[next(ordering)].pk}


def test_allocated_time_slot__order__by_applicant(graphql):
    # given:
    # - There are two allocated time slots
    allocation_1 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation__name="A",
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__application__organisation__name="B",
    )
    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by applicant in ascending order
    query = allocations_query(order_by="applicantAsc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}

    # when:
    # - Use tries to fetch the allocated time slots by applicant in descending order
    query = allocations_query(order_by="applicantDesc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_2.pk}
    assert response.node(1) == {"pk": allocation_1.pk}


def test_allocated_time_slot__order__by_application_section_name(graphql):
    # given:
    # - There are two allocated time slots
    allocation_1 = AllocatedTimeSlotFactory.create(reservation_unit_option__application_section__name="A")
    allocation_2 = AllocatedTimeSlotFactory.create(reservation_unit_option__application_section__name="B")
    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by application section name in ascending order
    query = allocations_query(order_by="applicationSectionNameAsc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}

    # when:
    # - Use tries to fetch the allocated time slots by application section name in descending order
    query = allocations_query(order_by="applicationSectionNameDesc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_2.pk}
    assert response.node(1) == {"pk": allocation_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_allocated_time_slot__order__by_allocated_unit_name(graphql, lang):
    # given:
    # - There are two allocated time slots
    allocation_1 = AllocatedTimeSlotFactory.create(
        **{f"reservation_unit_option__reservation_unit__unit__name_{lang}": "A"},
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        **{f"reservation_unit_option__reservation_unit__unit__name_{lang}": "B"},
    )
    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by allocated unit name in ascending order
    query = allocations_query(order_by=f"allocatedUnitName{lang.capitalize()}Asc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}

    # when:
    # - Use tries to fetch the allocated time slots by allocated unit name in descending order
    query = allocations_query(order_by=f"allocatedUnitName{lang.capitalize()}Desc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_2.pk}
    assert response.node(1) == {"pk": allocation_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_allocated_time_slot__order__by_allocated_reservation_unit_name(graphql, lang):
    # given:
    # - There are two allocated time slots
    allocation_1 = AllocatedTimeSlotFactory.create(
        **{f"reservation_unit_option__reservation_unit__name_{lang}": "A"},
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        **{f"reservation_unit_option__reservation_unit__name_{lang}": "B"},
    )
    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by allocated reservation unit name in ascending order
    query = allocations_query(order_by=f"allocatedReservationUnitName{lang.capitalize()}Asc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}

    # when:
    # - Use tries to fetch the allocated time slots by allocated reservation unit name in descending order
    query = allocations_query(order_by=f"allocatedReservationUnitName{lang.capitalize()}Desc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": allocation_2.pk}
    assert response.node(1) == {"pk": allocation_1.pk}


def test_allocated_time_slot__order__by_allocated_time_of_week(graphql):
    # given:
    # - There are four allocated time slots
    allocation_1 = AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(12, 0, tzinfo=get_default_timezone()),
        end_time=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    allocation_2 = AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(12, 0, tzinfo=get_default_timezone()),
        end_time=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    allocation_3 = AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(13, 0, tzinfo=get_default_timezone()),
        end_time=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    allocation_4 = AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.TUESDAY,
        begin_time=datetime.time(13, 0, tzinfo=get_default_timezone()),
        end_time=datetime.time(15, 0, tzinfo=get_default_timezone()),
    )
    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by allocated time of week in ascending order
    query = allocations_query(order_by="allocatedTimeOfWeekAsc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 4, response
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}
    assert response.node(2) == {"pk": allocation_3.pk}
    assert response.node(3) == {"pk": allocation_4.pk}

    # when:
    # - Use tries to fetch the allocated time slots by allocated time of week in descending order
    query = allocations_query(order_by="allocatedTimeOfWeekDesc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 4, response
    assert response.node(0) == {"pk": allocation_4.pk}
    assert response.node(1) == {"pk": allocation_3.pk}
    assert response.node(2) == {"pk": allocation_2.pk}
    assert response.node(3) == {"pk": allocation_1.pk}


def test_allocated_time_slot__order__by_application_status(graphql):
    # given:
    # - There are allocated time slots with different application statuses
    application_1 = ApplicationFactory.create_in_status_cancelled(
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    application_2 = ApplicationFactory.create_in_status_draft(
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    application_3 = ApplicationFactory.create_in_status_received(
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    application_4 = ApplicationFactory.create_in_status_result_sent(
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    application_5 = ApplicationFactory.create_in_status_expired(
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    application_6 = ApplicationFactory.create_in_status_handled(
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    application_7 = ApplicationFactory.create_in_status_in_allocation(
        application_sections__applied_reservations_per_week=2,
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )

    section_1 = application_1.application_sections.first()
    section_2 = application_2.application_sections.first()
    section_3 = application_3.application_sections.first()
    section_4 = application_4.application_sections.first()
    section_5 = application_5.application_sections.first()
    section_6 = application_6.application_sections.first()
    section_7 = application_7.application_sections.first()

    option_1 = section_1.reservation_unit_options.first()
    option_2 = section_2.reservation_unit_options.first()
    option_3 = section_3.reservation_unit_options.first()
    option_4 = section_4.reservation_unit_options.first()
    option_5 = section_5.reservation_unit_options.first()
    option_6 = section_6.reservation_unit_options.first()
    option_7 = section_7.reservation_unit_options.first()

    allocation_cancelled = option_1.allocated_time_slots.first()
    allocation_draft = option_2.allocated_time_slots.first()
    allocation_received = option_3.allocated_time_slots.first()
    allocation_results_sent = option_4.allocated_time_slots.first()
    allocation_expired = option_5.allocated_time_slots.first()
    allocation_handled = option_6.allocated_time_slots.first()
    allocation_in_allocation = option_7.allocated_time_slots.first()

    # Double check that values are correct
    assert application_1.status == ApplicationStatusChoice.CANCELLED
    assert application_2.status == ApplicationStatusChoice.DRAFT
    assert application_3.status == ApplicationStatusChoice.RECEIVED
    assert application_4.status == ApplicationStatusChoice.RESULTS_SENT
    assert application_5.status == ApplicationStatusChoice.EXPIRED
    assert application_6.status == ApplicationStatusChoice.HANDLED
    assert application_7.status == ApplicationStatusChoice.IN_ALLOCATION

    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by application status in ascending order
    query = allocations_query(order_by="applicationStatusAsc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 7, response
    assert response.node(0) == {"pk": allocation_draft.pk}
    assert response.node(1) == {"pk": allocation_cancelled.pk}
    assert response.node(2) == {"pk": allocation_expired.pk}
    assert response.node(3) == {"pk": allocation_received.pk}
    assert response.node(4) == {"pk": allocation_in_allocation.pk}
    assert response.node(5) == {"pk": allocation_handled.pk}
    assert response.node(6) == {"pk": allocation_results_sent.pk}

    # when:
    # - Use tries to fetch the allocated time slots by application status in descending order
    query = allocations_query(order_by="applicationStatusDesc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 7, response
    assert response.node(0) == {"pk": allocation_results_sent.pk}
    assert response.node(1) == {"pk": allocation_handled.pk}
    assert response.node(2) == {"pk": allocation_in_allocation.pk}
    assert response.node(3) == {"pk": allocation_received.pk}
    assert response.node(4) == {"pk": allocation_expired.pk}
    assert response.node(5) == {"pk": allocation_cancelled.pk}
    assert response.node(6) == {"pk": allocation_draft.pk}


def test_allocated_time_slot__order__by_application_section_status(graphql):
    # given:
    # - There are allocated time slots with different application section statuses
    section_1 = ApplicationSectionFactory.create_in_status_unallocated(
        applied_reservations_per_week=2,
        reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    section_2 = ApplicationSectionFactory.create_in_status_in_allocation(
        applied_reservations_per_week=2,
        reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    section_3 = ApplicationSectionFactory.create_in_status_handled()

    option_1 = section_1.reservation_unit_options.first()
    option_2 = section_2.reservation_unit_options.first()
    option_3 = section_3.reservation_unit_options.first()

    allocation_1 = option_1.allocated_time_slots.first()
    allocation_2 = option_2.allocated_time_slots.first()
    allocation_3 = option_3.allocated_time_slots.first()

    # Double check that values are correct
    assert section_1.status == ApplicationSectionStatusChoice.UNALLOCATED
    assert section_2.status == ApplicationSectionStatusChoice.IN_ALLOCATION
    assert section_3.status == ApplicationSectionStatusChoice.HANDLED

    graphql.login_with_superuser()

    # when:
    # - Use tries to fetch the allocated time slots by application section status in ascending order
    query = allocations_query(order_by="applicationSectionStatusAsc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": allocation_1.pk}
    assert response.node(1) == {"pk": allocation_2.pk}
    assert response.node(2) == {"pk": allocation_3.pk}

    # when:
    # - Use tries to fetch the allocated time slots by application section status in descending order
    query = allocations_query(order_by="applicationSectionStatusDesc")
    response = graphql(query)

    # then:
    # - The response contains the allocations in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": allocation_3.pk}
    assert response.node(1) == {"pk": allocation_2.pk}
    assert response.node(2) == {"pk": allocation_1.pk}
