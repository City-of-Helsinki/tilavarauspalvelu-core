import datetime

import pytest

from applications.models import ApplicationSection
from tests.factories import ApplicationFactory, ReservationUnitFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_sections__actions__affecting_allocations(query_counter):
    parent_space = SpaceFactory.create()
    parent_unit = ReservationUnitFactory.create(spaces=[parent_space])

    common_space = SpaceFactory.create(parent=parent_space)
    common_unit = ReservationUnitFactory.create(spaces=[common_space])

    # Check sections affecting allocations for this application's section
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
    begin_date = datetime.date(2022, 1, 1)
    end_date = datetime.date(2022, 2, 1)
    ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=common_unit, begin_date=begin_date, end_date=end_date, pre_allocated=True
    )

    # This application is allocated for a parent unit -> Affecting.
    application_3 = ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=parent_unit,
        pre_allocated=True,
    )

    section_1: ApplicationSection = application_1.application_sections.first()
    section_2: ApplicationSection = application_2.application_sections.first()
    section_3: ApplicationSection = application_3.application_sections.first()

    with query_counter() as counter:
        sections = section_1.actions.application_sections_affecting_allocations()
        sections = sections.order_by("pk").values_list("pk", flat=True)
        sections = list(sections)

    assert len(counter.queries) == 1, counter.log
    assert list(sections) == [section_2.pk, section_3.pk]
