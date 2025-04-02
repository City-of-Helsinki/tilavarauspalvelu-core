from __future__ import annotations

from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing import parametrize_helper
from graphql_relay import to_global_id

from .helpers import do_replacements, get_customer_query_factories

pytestmark = [
    pytest.mark.django_db,
]


class Params(NamedTuple):
    query_name: str
    variables: dict[str, Any]
    replacements: dict[str, Any]
    need_id: bool = False
    typename: str = ""


@pytest.mark.parametrize(
    **parametrize_helper({
        "ReservationUnitPurposes": Params(
            query_name="ReservationUnitPurposes",
            variables={},
            replacements={},
        ),
        "ApplicationRecurringReservation": Params(
            query_name="ApplicationRecurringReservation",
            variables={},
            replacements={},
            need_id=True,
            typename="RecurringReservationNode",
        ),
        "ReservationPage": Params(
            query_name="ReservationPage",
            variables={},
            replacements={},
            need_id=True,
            typename="ReservationNode",
        ),
    })
)
def test_frontend_queries__customer_ui(graphql, query_name, variables, replacements, need_id, typename):
    factories = get_customer_query_factories()
    queries = factories[query_name]

    query: str | None = None
    for info in queries.values():
        query = info.query
        do_replacements(info.args, **replacements)
        obj = info.factory.create(**info.args)
        if need_id:
            variables["id"] = to_global_id(typename, obj.id)

    assert query is not None, "No query found"

    graphql.login_with_superuser()

    response = graphql(query, variables=variables)

    assert response.has_errors is False, response.errors
