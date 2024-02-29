import datetime

import pytest

from tests.factories import (
    AllocatedTimeSlotFactory,
    ReservationUnitFactory,
    ReservationUnitOptionFactory,
    SpaceFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_sections__actions__affecting_allocations(query_counter):
    parent_space = SpaceFactory.create()
    common_space = SpaceFactory.create(parent=parent_space)

    parent_unit = ReservationUnitFactory.create(spaces=[parent_space])
    common_unit = ReservationUnitFactory.create(spaces=[common_space])

    # Check allocations affecting this allocation's section
    slot_1 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=common_unit)

    # Allocation for the same reservation unit -> Affecting.
    slot_2 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=common_unit)

    # Allocation for a different reservation unit -> Not affecting.
    AllocatedTimeSlotFactory.create()

    # Reservation unit option for the same reservation unit, but no allocation -> Not affecting.
    ReservationUnitOptionFactory.create(reservation_unit=common_unit)

    # Allocation for the same reservation unit, but for a different period -> Not affecting.
    AllocatedTimeSlotFactory.create(
        reservation_unit_option__reservation_unit=common_unit,
        reservation_unit_option__application_section__reservations_begin_date=datetime.date(2022, 1, 1),
        reservation_unit_option__application_section__reservations_end_date=datetime.date(2022, 2, 1),
    )

    # Allocated for a parent reservation unit -> Affecting.
    slot_3 = AllocatedTimeSlotFactory.create(reservation_unit_option__reservation_unit=parent_unit)

    section = slot_1.reservation_unit_option.application_section

    with query_counter() as counter:
        allocations = section.actions.affecting_allocations(reservation_unit=common_unit.pk)
        allocations = allocations.order_by("pk").values_list("pk", flat=True)
        allocations = list(allocations)

    assert len(counter.queries) == 1, counter.log
    assert list(allocations) == [slot_2.pk, slot_3.pk]
