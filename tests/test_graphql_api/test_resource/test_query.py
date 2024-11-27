from __future__ import annotations

import pytest
from graphql_relay import to_global_id

from tests.factories import ResourceFactory

from .helpers import resource_query, resources_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resources__query__all_fields(graphql):
    resource = ResourceFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        locationType
        space {
            pk
        }
    """

    query = resources_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": resource.pk,
        "nameFi": resource.name_fi,
        "nameSv": resource.name_sv,
        "nameEn": resource.name_en,
        "locationType": resource.location_type.upper(),
        "space": {
            "pk": resource.space.pk,
        },
    }


def test_resource__not_found(graphql):
    graphql.login_with_superuser()

    global_id = to_global_id("ResourceNode", -1)
    query = resource_query(id=global_id)
    response = graphql(query)

    assert response.first_query_object is None
