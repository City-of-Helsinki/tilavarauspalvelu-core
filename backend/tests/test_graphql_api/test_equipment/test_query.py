from __future__ import annotations

import pytest

from tests.factories import EquipmentFactory

from .helpers import equipments_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__query(graphql):
    equipment = EquipmentFactory.create(name="foo")

    graphql.login_with_superuser()
    query = equipments_query(fields="name { fi en sv }")
    response = graphql(query)

    assert response.has_errors is False
    assert response.results == [
        {
            "name": {"fi": equipment.name_fi, "en": equipment.name_en, "sv": equipment.name_sv},
        },
    ]


def test_equipment__order__by_category_rank(graphql):
    equipment_1 = EquipmentFactory.create(name="foo", category__rank=2)
    equipment_2 = EquipmentFactory.create(name="bar", category__rank=3)
    equipment_3 = EquipmentFactory.create(name="baz", category__rank=1)

    graphql.login_with_superuser()
    query = equipments_query(fields="name { fi en sv } category { name { fi en sv } }", order_by="categoryRankAsc")
    response = graphql(query)

    assert response.has_errors is False
    assert response.results == [
        {
            "name": {
                "fi": equipment_3.name_fi,
                "en": equipment_3.name_en,
                "sv": equipment_3.name_sv,
            },
            "category": {
                "name": {
                    "fi": equipment_3.category.name_fi,
                    "en": equipment_3.category.name_en,
                    "sv": equipment_3.category.name_sv,
                }
            },
        },
        {
            "name": {
                "fi": equipment_1.name_fi,
                "en": equipment_1.name_en,
                "sv": equipment_1.name_sv,
            },
            "category": {
                "name": {
                    "fi": equipment_1.category.name_fi,
                    "en": equipment_1.category.name_en,
                    "sv": equipment_1.category.name_sv,
                }
            },
        },
        {
            "name": {
                "fi": equipment_2.name_fi,
                "en": equipment_2.name_en,
                "sv": equipment_2.name_sv,
            },
            "category": {
                "name": {
                    "fi": equipment_2.category.name_fi,
                    "en": equipment_2.category.name_en,
                    "sv": equipment_2.category.name_sv,
                }
            },
        },
    ]


def test_equipment__filter__by_category_rank(graphql):
    equipment_1 = EquipmentFactory.create(name="1", category__rank=2)
    equipment_2 = EquipmentFactory.create(name="2", category__rank=1)
    EquipmentFactory.create(name="3", category__rank=3)

    graphql.login_with_superuser()
    query = equipments_query(fields="nameFi category { nameFi }", rank_gte=1, rank_lte=2, order_by="nameAsc")
    response = graphql(query)

    assert response.has_errors is False
    assert response.results == [
        {
            "nameFi": equipment_1.name_fi,
            "category": {"nameFi": equipment_1.category.name_fi},
        },
        {
            "nameFi": equipment_2.name_fi,
            "category": {"nameFi": equipment_2.category.name_fi},
        },
    ]
