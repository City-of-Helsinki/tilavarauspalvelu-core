import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import QualifierFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__query(graphql):
    qualifier = QualifierFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameEn
        nameSv
    """
    query = build_query("qualifiers", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": qualifier.pk,
        "nameFi": qualifier.name_fi,
        "nameEn": qualifier.name_en,
        "nameSv": qualifier.name_sv,
    }
