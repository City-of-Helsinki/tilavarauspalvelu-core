import pytest

from tests.factories import AllocatedTimeSlotFactory
from tests.helpers import UserType

from .helpers import allocations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__query__all_fields(graphql):
    # given:
    # - There is an allocated time slot
    allocation = AllocatedTimeSlotFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        dayOfTheWeek
        beginTime
        endTime
        reservationUnitOption {
            pk
            preferredOrder
            locked
            rejected
            reservationUnit {
                pk
                nameFi
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
            "locked": allocation.reservation_unit_option.locked,
            "rejected": allocation.reservation_unit_option.rejected,
            "reservationUnit": {
                "pk": allocation.reservation_unit_option.reservation_unit.pk,
                "nameFi": allocation.reservation_unit_option.reservation_unit.name,
            },
        },
    }
