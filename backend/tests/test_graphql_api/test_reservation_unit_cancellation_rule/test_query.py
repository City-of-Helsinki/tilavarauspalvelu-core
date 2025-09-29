from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationUnitCancellationRuleFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_cancellation_rules__query(graphql):
    rules = ReservationUnitCancellationRuleFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        name {
            fi
            sv
            en
        }
    """
    query = build_query("reservationUnitCancellationRules", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": rules.pk,
        "name": {
            "fi": rules.name_fi,
            "sv": rules.name_sv,
            "en": rules.name_en,
        },
    }


def test_reservation_unit_cancellation_rules__query__anonymous_user(graphql):
    ReservationUnitCancellationRuleFactory.create()

    fields = """
        pk
        name {
            fi
            sv
            en
        }
    """
    query = build_query("reservationUnitCancellationRules", fields=fields, connection=True)
    response = graphql(query)

    assert response.error_message() == "No permission to access node."
