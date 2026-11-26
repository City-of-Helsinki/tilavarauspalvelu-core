from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import ApplicationFactory

from .helpers import section_options_query

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_option__query__through_application_sections(graphql: GraphQLClient) -> None:
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.get()
    option = section.reservation_unit_options.get()
    allocation = option.allocated_time_slots.get()

    assert option is not None

    graphql.login_with_superuser()

    fields = """
        reservationUnitOptions {
            pk
            preferredOrder
            isLocked
            isRejected
            reservationUnit {
                pk
            }
            allocatedTimeSlots {
                pk
            }
        }
    """

    query = section_options_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1

    assert response.node(0) == {
        "reservationUnitOptions": [
            {
                "pk": option.pk,
                "preferredOrder": option.preferred_order,
                "isLocked": option.is_locked,
                "isRejected": option.is_rejected,
                "reservationUnit": {"pk": option.reservation_unit.pk},
                "allocatedTimeSlots": [{"pk": allocation.pk}],
            }
        ]
    }
