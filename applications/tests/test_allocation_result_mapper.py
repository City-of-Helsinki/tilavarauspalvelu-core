import pytest
from assertpy import assert_that

from allocation.allocation_data_builder import AllocationDataBuilder
from allocation.allocation_solver import AllocationSolver
from applications.allocation_result_mapper import AllocationResultMapper
from applications.models import ApplicationEventScheduleResult


@pytest.mark.django_db
def test_allocation_result_mapper_creates_results(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
    matching_event_reservation_unit,
):
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()
    solver = AllocationSolver(allocation_data=data)
    allocation_events = solver.solve()
    mapper = AllocationResultMapper(allocation_events)
    mapper.to_events()
    assert_that(ApplicationEventScheduleResult.objects.count()).is_not_zero()
