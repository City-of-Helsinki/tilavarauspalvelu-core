from __future__ import annotations

import pytest

from tests.factories import EquipmentCategoryFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__update(graphql):
    category = EquipmentCategoryFactory.create(name="foo")
    data = {"pk": category.pk, "nameFi": "bar"}

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    category.refresh_from_db()
    assert category.name == "bar"
