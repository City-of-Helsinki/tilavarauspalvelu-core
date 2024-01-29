import datetime

import pytest

from applications.models import ApplicationEvent
from tests.factories import ApplicationFactory, ReservationUnitFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_events_affecting_allocations(query_counter):
    parent_space = SpaceFactory.create()
    parent_unit = ReservationUnitFactory.create(spaces=[parent_space])

    common_space = SpaceFactory.create(parent=parent_space)
    common_unit = ReservationUnitFactory.create(spaces=[common_space])

    # Check events affecting allocations for this application's event
    application_1 = ApplicationFactory.create_application_ready_for_allocation(reservation_unit=common_unit)

    # This application is allocated for the same unit -> Affecting.
    application_2 = ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=common_unit, pre_allocated=True
    )
    # This application is allocated, but for a different reservation unit -> Not affecting.
    ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)

    # This application is for the same unit, but it's not allocated -> Not affecting.
    ApplicationFactory.create_application_ready_for_allocation(reservation_unit=common_unit)

    # This application is allocated for the same unit, but for a different period -> Not affecting.
    begin = datetime.date(2022, 1, 1)
    end = datetime.date(2022, 2, 1)
    ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=common_unit, begin=begin, end=end, pre_allocated=True
    )

    # This application is allocated for a parent unit -> Affecting.
    application_3 = ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=parent_unit, pre_allocated=True
    )

    event_1: ApplicationEvent = application_1.application_events.first()
    event_2: ApplicationEvent = application_2.application_events.first()
    event_3: ApplicationEvent = application_3.application_events.first()

    with query_counter() as counter:
        events = event_1.actions.application_events_affecting_allocations().order_by("pk").values_list("pk", flat=True)
        events = list(events)

    assert len(counter.queries) == 1, counter.log
    assert list(events) == [event_2.pk, event_3.pk]
