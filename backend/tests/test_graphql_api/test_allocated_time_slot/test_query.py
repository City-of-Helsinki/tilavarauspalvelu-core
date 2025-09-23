from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tilavarauspalvelu.models import ReservationUnitHierarchy

from tests.factories import AllocatedTimeSlotFactory, ReservationSeriesFactory, ReservationUnitFactory, SpaceFactory

from .helpers import allocations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__query__all_fields(graphql):
    # given:
    # - There is an allocated time slot
    allocation = AllocatedTimeSlotFactory.create()
    ReservationSeriesFactory.create(allocated_time_slot=allocation)
    graphql.login_with_superuser()

    fields = """
        pk
        dayOfTheWeek
        beginTime
        endTime
        reservationUnitOption {
            pk
            preferredOrder
            isLocked
            isRejected
            reservationUnit {
                pk
                nameFi
            }
        }
        reservationSeries {
            pk
            name
            reservations {
                pk
            }
        }
    """

    # when:
    # - User tries to search all fields for allocations
    query = allocations_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains the selected fields from the allocated time slots
    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": allocation.pk,
        "dayOfTheWeek": allocation.day_of_the_week,
        "beginTime": allocation.begin_time.isoformat(),
        "endTime": allocation.end_time.isoformat(),
        "reservationUnitOption": {
            "pk": allocation.reservation_unit_option.pk,
            "preferredOrder": allocation.reservation_unit_option.preferred_order,
            "isLocked": allocation.reservation_unit_option.is_locked,
            "isRejected": allocation.reservation_unit_option.is_rejected,
            "reservationUnit": {
                "pk": allocation.reservation_unit_option.reservation_unit.pk,
                "nameFi": allocation.reservation_unit_option.reservation_unit.name,
            },
        },
        "reservationSeries": {
            "pk": allocation.reservation_series.pk,
            "name": allocation.reservation_series.name,
            "reservations": [],
        },
    }


def test_affecting_allocated_time_slots__query(graphql):
    # given:
    # - There is a timeslot in the system
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])
    allocation = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=reservation_unit)
    ReservationUnitHierarchy.refresh()

    graphql.login_with_superuser()

    fields = """
        pk
        dayOfTheWeek
        beginTime
        endTime
    """

    # when:
    # - User tries to query timeslots that affect the given reservation unit
    query = build_query(
        "affectingAllocatedTimeSlots",
        fields=fields,
        reservation_unit=allocation.reservation_unit_option.reservation_unit.pk,
        begin_date=allocation.reservation_unit_option.application_section.reservations_begin_date.isoformat(),
        end_date=allocation.reservation_unit_option.application_section.reservations_end_date.isoformat(),
    )
    response = graphql(query)

    # then:
    # - The response contains the allocations that affect the given reservation unit
    assert len(response.first_query_object) == 1
    assert response.first_query_object[0] == {
        "pk": allocation.pk,
        "dayOfTheWeek": allocation.day_of_the_week,
        "beginTime": allocation.begin_time.isoformat(),
        "endTime": allocation.end_time.isoformat(),
    }
