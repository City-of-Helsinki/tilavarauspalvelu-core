from django.utils.datetime_safe import datetime

from allocation.allocation_data_builder import AllocationDataBuilder
from allocation.allocation_solver import AllocationSolver
from allocation.models import AllocationRequest


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
        solver.solve()
    except Exception:
        # Safeguard so we don't lock allocation on unexpected exceptions even though this shouldn't throw anything
        allocation_request.application_round.allocating = False
        allocation_request.application_round.save()
        allocation_request.end_date = datetime.now()
        allocation_request.completed = False
        allocation_request.save()

    allocation_request.application_round.allocating = False
    allocation_request.application_round.save()
    allocation_request.end_date = datetime.now()
    allocation_request.completed = True
    allocation_request.save()
