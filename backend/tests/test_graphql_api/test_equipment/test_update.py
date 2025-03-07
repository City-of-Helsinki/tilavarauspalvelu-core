from __future__ import annotations

import pytest

from tests.factories import EquipmentFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__update(graphql):
    equipment = EquipmentFactory.create(name="foo")

    data = {"pk": equipment.pk, "nameFi": "bar", "category": equipment.category.pk}

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    equipment.refresh_from_db()
    assert equipment.name_fi == "bar"
