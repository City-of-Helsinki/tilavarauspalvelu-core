from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ServiceSectorFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_service_sectors__query(graphql):
    sector = ServiceSectorFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
    """
    query = build_query("serviceSectors", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {
        "pk": sector.pk,
        "nameFi": sector.name_fi,
        "nameSv": sector.name_sv,
        "nameEn": sector.name_en,
    }
