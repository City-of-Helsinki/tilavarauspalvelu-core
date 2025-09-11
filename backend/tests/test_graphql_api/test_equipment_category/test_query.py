from __future__ import annotations

import pytest

from tests.factories import EquipmentCategoryFactory

from .helpers import equipment_categories_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__query(graphql):
    category = EquipmentCategoryFactory.create(name="foo")

    graphql.login_with_superuser()
    query = equipment_categories_query(fields="name { fi sv en }")
    response = graphql(query)

    assert response.has_errors is False
    assert response.results == [
        {
            "name": {
                "fi": category.name_fi,
                "sv": category.name_sv,
                "en": category.name_en,
            },
        }
    ]
