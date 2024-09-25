import datetime

import pytest

from applications.enums import Weekday
from applications.models import AllocatedTimeSlot
from tests.factories import AllocatedTimeSlotFactory, ReservationUnitFactory, ReservationUnitOptionFactory, SpaceFactory
from tilavarauspalvelu.models import ReservationUnitHierarchy

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__allocated_time_of_week__day_of_the_week_number():
    allocation = AllocatedTimeSlotFactory.create(
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(12, 0),
        end_time=datetime.time(14, 0),
    )
    assert allocation.allocated_time_of_week == "1-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 1

    allocation.day_of_the_week = Weekday.TUESDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "2-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 2

    allocation.day_of_the_week = Weekday.WEDNESDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "3-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 3

    allocation.day_of_the_week = Weekday.THURSDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "4-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 4

    allocation.day_of_the_week = Weekday.FRIDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "5-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 5

    allocation.day_of_the_week = Weekday.SATURDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "6-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 6

    allocation.day_of_the_week = Weekday.SUNDAY
    allocation.save()
    assert allocation.allocated_time_of_week == "7-12:00:00-14:00:00"
    assert allocation.day_of_the_week_number == 7


def test_allocated_time_slot__affecting_allocations(query_counter):
    parent_space = SpaceFactory.create()
    common_space = SpaceFactory.create(parent=parent_space)

    parent_unit = ReservationUnitFactory.create(spaces=[parent_space])
    common_unit = ReservationUnitFactory.create(spaces=[common_space])

    period_begin = datetime.date(2024, 1, 1)
    period_end = datetime.date(2024, 2, 1)

    # Allocation for the common reservation unit on the period -> Affecting.
    slot_1 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__reservation_unit=common_unit,
        reservation_unit_option__application_section__reservations_begin_date=period_begin,
        reservation_unit_option__application_section__reservations_end_date=period_end,
    )

    # Allocation for a different reservation unit -> Not affecting.
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__application_section__reservations_begin_date=period_begin,
        reservation_unit_option__application_section__reservations_end_date=period_end,
    )

    # Reservation unit option for the same reservation unit, but no allocation -> Not affecting.
    ReservationUnitOptionFactory.create(
        reservation_unit=common_unit,
        application_section__reservations_begin_date=period_begin,
        application_section__reservations_end_date=period_end,
    )

    # Allocation for the same reservation unit, but for a different period -> Not affecting.
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__reservation_unit=common_unit,
        reservation_unit_option__application_section__reservations_begin_date=datetime.date(2022, 1, 1),
        reservation_unit_option__application_section__reservations_end_date=datetime.date(2022, 2, 1),
    )

    # Allocated for a parent reservation unit -> Affecting.
    slot_2 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__reservation_unit=parent_unit,
        reservation_unit_option__application_section__reservations_begin_date=period_begin,
        reservation_unit_option__application_section__reservations_end_date=period_end,
    )

    # Allocation for the common reservation unit, period begins on end date -> Affecting.
    slot_3 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__reservation_unit=common_unit,
        reservation_unit_option__application_section__reservations_begin_date=datetime.date(2024, 2, 1),
        reservation_unit_option__application_section__reservations_end_date=datetime.date(2024, 3, 1),
    )

    # Allocation for the common reservation unit, period ends on begin date -> Affecting.
    slot_4 = AllocatedTimeSlotFactory.create(
        reservation_unit_option__reservation_unit=common_unit,
        reservation_unit_option__application_section__reservations_begin_date=datetime.date(2023, 12, 1),
        reservation_unit_option__application_section__reservations_end_date=datetime.date(2024, 1, 1),
    )

    ReservationUnitHierarchy.refresh()

    with query_counter() as counter:
        allocations = AllocatedTimeSlot.objects.affecting_allocations(
            reservation_unit=common_unit.pk,
            begin_date=period_begin,
            end_date=period_end,
        )
        allocations = allocations.order_by("pk").values_list("pk", flat=True)
        allocations = list(allocations)

    assert len(counter.queries) == 1, counter.log
    assert list(allocations) == [slot_1.pk, slot_2.pk, slot_3.pk, slot_4.pk]
