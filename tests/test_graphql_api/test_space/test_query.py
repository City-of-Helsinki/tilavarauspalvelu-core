import pytest

from tests.factories import SpaceFactory
from tests.test_graphql_api.test_space.helpers import spaces_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_query_spaces__all_fields(graphql):
    # given:
    # - There are two spaces in the database
    # - A superuser is using the system
    space = SpaceFactory.create()
    SpaceFactory.create()
    graphql.login_with_superuser()

    fields = """
        pk
        nameFi
        nameSv
        nameEn
        surfaceArea
        maxPersons
        code
        parent {
            pk
        }
        unit {
            pk
        }
        children {
            pk
        }
        resources {
            pk
        }
    """

    # when:
    # - User tries to search for spaces with all fields
    response = graphql(spaces_query(fields=fields))

    # then:
    # - The response contains the expected spaces with all fields
    assert response.has_errors is False, response
    assert len(response.edges) == 2
    assert response.node(0) == {
        "pk": space.pk,
        "nameFi": space.name_fi,
        "nameSv": space.name_sv,
        "nameEn": space.name_en,
        "surfaceArea": space.surface_area,
        "maxPersons": space.max_persons,
        "code": space.code,
        "parent": None,
        "unit": {
            "pk": space.unit.pk,
        },
        "children": [],
        "resources": [],
    }
