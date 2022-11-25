from django.utils.datetime_safe import datetime
from django.utils.timezone import get_default_timezone

from allocation.allocation_data_builder import AllocationDataBuilder
from allocation.allocation_solver import AllocationSolver
from allocation.models import AllocationRequest
from applications.allocation_result_mapper import AllocationResultMapper


def start_allocation(allocation_request: AllocationRequest):
    data = AllocationDataBuilder(
        application_round=allocation_request.application_round,
        output_basket_ids=[
            basket.id for basket in allocation_request.application_round_baskets.all()
        ],
    ).get_allocation_data()
    solver = AllocationSolver(allocation_data=data)
    allocation_request.application_round.allocating = True
    allocation_request.application_round.save()
    try:
        allocation_events = solver.solve()
        mapper = AllocationResultMapper(
            allocated_events=allocation_events,
            application_round=allocation_request.application_round,
        )
        mapper.to_events()
    except Exception:
        # Safeguard so we don't lock allocation on unexpected exceptions even though this shouldn't throw anything
        allocation_request.application_round.allocating = False
        allocation_request.application_round.save()
        allocation_request.end_date = datetime.now(tz=get_default_timezone())
        allocation_request.completed = False
        allocation_request.save()
        raise

    allocation_request.application_round.allocating = False
    allocation_request.application_round.save()
    allocation_request.end_date = datetime.now(tz=get_default_timezone())
    allocation_request.completed = True
    allocation_request.save()
