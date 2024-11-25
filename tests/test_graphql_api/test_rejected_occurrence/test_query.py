from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import RejectionReadinessChoice, Weekday

from tests.factories import RejectedOccurrenceFactory

from .helpers import rejected_occurrence_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_rejected_recurrence__query__all_fields(graphql):
    occurrence = RejectedOccurrenceFactory.create()
    graphql.login_with_superuser()

    fields = """
        pk
        beginDatetime
        endDatetime
        rejectionReason
        createdAt
        recurringReservation {
            pk
            name
        }
    """
    query = rejected_occurrence_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": occurrence.pk,
        "beginDatetime": occurrence.begin_datetime.isoformat(),
        "endDatetime": occurrence.end_datetime.isoformat(),
        "rejectionReason": occurrence.rejection_reason,
        "createdAt": occurrence.created_at.isoformat(),
        "recurringReservation": {
            "pk": occurrence.recurring_reservation.pk,
            "name": occurrence.recurring_reservation.name,
        },
    }


def test_rejected_recurrence__filter__by_pk(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create()
    occurrence_2 = RejectedOccurrenceFactory.create()
    RejectedOccurrenceFactory.create()

    graphql.login_with_superuser()
    query = rejected_occurrence_query(pk=[occurrence_1.pk, occurrence_2.pk])
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}


def test_rejected_recurrence__filter__by_recurring_reservation(graphql):
    RejectedOccurrenceFactory.create()
    occurrence = RejectedOccurrenceFactory.create()
    RejectedOccurrenceFactory.create()

    graphql.login_with_superuser()
    query = rejected_occurrence_query(recurring_reservation=occurrence.recurring_reservation.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": occurrence.pk}


def test_rejected_recurrence__filter__by_application_round(graphql):
    RejectedOccurrenceFactory.create()
    occurrence = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )
    RejectedOccurrenceFactory.create()

    option = occurrence.recurring_reservation.allocated_time_slot.reservation_unit_option
    application_round = option.application_section.application.application_round

    graphql.login_with_superuser()
    query = rejected_occurrence_query(application_round=application_round.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": occurrence.pk}


def test_rejected_recurrence__filter__by_reservation_unit(graphql):
    RejectedOccurrenceFactory.create()
    occurrence = RejectedOccurrenceFactory.create()
    RejectedOccurrenceFactory.create()

    reservation_unit = occurrence.recurring_reservation.reservation_unit

    graphql.login_with_superuser()
    query = rejected_occurrence_query(reservation_unit=reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": occurrence.pk}


def test_rejected_recurrence__filter__by_unit(graphql):
    RejectedOccurrenceFactory.create()
    occurrence = RejectedOccurrenceFactory.create()
    RejectedOccurrenceFactory.create()

    unit = occurrence.recurring_reservation.reservation_unit.unit

    graphql.login_with_superuser()
    query = rejected_occurrence_query(unit=unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": occurrence.pk}


def test_rejected_recurrence__filter__by_text_search(graphql):
    # Works similarly to allocated time slot text search.
    # No need to test as thoroughly.
    section_ref = "recurring_reservation__allocated_time_slot__reservation_unit_option__application_section"
    occurrence = RejectedOccurrenceFactory.create(**{
        f"{section_ref}__application__organisation": None,
        f"{section_ref}__application__contact_person": None,
        f"{section_ref}__application__user": None,
        f"{section_ref}__name": "foo",
    })
    RejectedOccurrenceFactory.create(**{
        f"{section_ref}__application__organisation": None,
        f"{section_ref}__application__contact_person": None,
        f"{section_ref}__application__user": None,
        f"{section_ref}__name": "bar",
    })

    graphql.login_with_superuser()
    query = rejected_occurrence_query(text_search="foo")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": occurrence.pk}


def test_rejected_recurrence__order__by_pk(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create()
    occurrence_2 = RejectedOccurrenceFactory.create()
    occurrence_3 = RejectedOccurrenceFactory.create()

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="pkAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="pkDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_begin_datetime(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create(begin_datetime=datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
    occurrence_2 = RejectedOccurrenceFactory.create(begin_datetime=datetime.datetime(2024, 1, 2, tzinfo=datetime.UTC))
    occurrence_3 = RejectedOccurrenceFactory.create(begin_datetime=datetime.datetime(2024, 1, 3, tzinfo=datetime.UTC))

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="beginDatetimeAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="beginDatetimeDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_end_datetime(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create(end_datetime=datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
    occurrence_2 = RejectedOccurrenceFactory.create(end_datetime=datetime.datetime(2024, 1, 2, tzinfo=datetime.UTC))
    occurrence_3 = RejectedOccurrenceFactory.create(end_datetime=datetime.datetime(2024, 1, 3, tzinfo=datetime.UTC))

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="endDatetimeAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="endDatetimeDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_rejection_reason(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create(rejection_reason=RejectionReadinessChoice.INTERVAL_NOT_ALLOWED)
    occurrence_2 = RejectedOccurrenceFactory.create(rejection_reason=RejectionReadinessChoice.OVERLAPPING_RESERVATIONS)
    occurrence_3 = RejectedOccurrenceFactory.create(rejection_reason=RejectionReadinessChoice.RESERVATION_UNIT_CLOSED)

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="rejectionReasonAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="rejectionReasonDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_application_pk(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )
    occurrence_2 = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )
    occurrence_3 = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="applicationPkAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="applicationPkDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_application_section_pk(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )
    occurrence_2 = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )
    occurrence_3 = RejectedOccurrenceFactory.create(
        recurring_reservation__allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="applicationSectionPkAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="applicationSectionPkDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_reservation_unit_pk(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create()
    occurrence_2 = RejectedOccurrenceFactory.create()
    occurrence_3 = RejectedOccurrenceFactory.create()

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="reservationUnitPkAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="reservationUnitPkDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_reservation_unit_name(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create(recurring_reservation__reservation_unit__name="A")
    occurrence_2 = RejectedOccurrenceFactory.create(recurring_reservation__reservation_unit__name="C")
    occurrence_3 = RejectedOccurrenceFactory.create(recurring_reservation__reservation_unit__name="B")

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="reservationUnitNameAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_3.pk}
    assert response.node(2) == {"pk": occurrence_2.pk}

    query = rejected_occurrence_query(order_by="reservationUnitNameDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_2.pk}
    assert response.node(1) == {"pk": occurrence_3.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_unit_pk(graphql):
    occurrence_1 = RejectedOccurrenceFactory.create()
    occurrence_2 = RejectedOccurrenceFactory.create()
    occurrence_3 = RejectedOccurrenceFactory.create()

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="unitPkAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="unitPkDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}


def test_rejected_recurrence__order__by_applicant(graphql):
    section_ref = "recurring_reservation__allocated_time_slot__reservation_unit_option__application_section"
    occurrence_1 = RejectedOccurrenceFactory.create(**{f"{section_ref}__application__organisation__name": "A"})
    occurrence_2 = RejectedOccurrenceFactory.create(**{f"{section_ref}__application__organisation__name": "B"})
    occurrence_3 = RejectedOccurrenceFactory.create(**{f"{section_ref}__application__organisation__name": "C"})

    graphql.login_with_superuser()
    query = rejected_occurrence_query(order_by="applicantAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_1.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_3.pk}

    query = rejected_occurrence_query(order_by="applicantDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": occurrence_3.pk}
    assert response.node(1) == {"pk": occurrence_2.pk}
    assert response.node(2) == {"pk": occurrence_1.pk}
