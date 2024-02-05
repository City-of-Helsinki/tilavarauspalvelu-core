from functools import partial

import pytest

from tests.factories import CityFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

age_groups_query = partial(build_query, "cities", connection=True)


def test_age_group__query__all_fields(graphql):
    city_1 = CityFactory.create()
    city_2 = CityFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        nameFi
        nameEn
        nameSv
    """
    response = graphql(age_groups_query(fields=fields))

    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": city_1.pk,
        "nameFi": city_1.name_fi,
        "nameEn": city_1.name_en,
        "nameSv": city_1.name_sv,
    }
    assert response.node(1) == {
        "pk": city_2.pk,
        "nameFi": city_2.name_fi,
        "nameEn": city_2.name_en,
        "nameSv": city_2.name_sv,
    }
