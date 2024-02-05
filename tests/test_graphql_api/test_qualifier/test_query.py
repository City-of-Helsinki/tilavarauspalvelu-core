import pytest

from tests.factories import QualifierFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__query(graphql):
    qualifier = QualifierFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

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
