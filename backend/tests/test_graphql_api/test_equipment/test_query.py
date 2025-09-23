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
    query = equipments_query(fields="nameFi")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1

    assert response.node(0) == {
        "nameFi": equipment.name_fi,
    }


def test_equipment__order__by_category_rank(graphql):
    equipment_1 = EquipmentFactory.create(name="foo", category__rank=2)
    equipment_2 = EquipmentFactory.create(name="bar", category__rank=3)
    equipment_3 = EquipmentFactory.create(name="baz", category__rank=1)

    graphql.login_with_superuser()
    query = equipments_query(fields="nameFi category { nameFi }", order_by="categoryRankAsc")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 3

    assert response.node(0) == {
        "nameFi": equipment_3.name_fi,
        "category": {"nameFi": equipment_3.category.name_fi},
    }

    assert response.node(1) == {
        "nameFi": equipment_1.name_fi,
        "category": {"nameFi": equipment_1.category.name_fi},
    }

    assert response.node(2) == {
        "nameFi": equipment_2.name_fi,
        "category": {"nameFi": equipment_2.category.name_fi},
    }


def test_equipment__filter__by_category_rank(graphql):
    equipment_1 = EquipmentFactory.create(name="1", category__rank=2)
    equipment_2 = EquipmentFactory.create(name="2", category__rank=1)
    EquipmentFactory.create(name="3", category__rank=3)

    graphql.login_with_superuser()
    query = equipments_query(fields="nameFi category { nameFi }", rank_gte=1, rank_lte=2, order_by="nameAsc")
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 2

    assert response.node(0) == {
        "nameFi": equipment_1.name_fi,
        "category": {"nameFi": equipment_1.category.name_fi},
    }

    assert response.node(1) == {
        "nameFi": equipment_2.name_fi,
        "category": {"nameFi": equipment_2.category.name_fi},
    }
