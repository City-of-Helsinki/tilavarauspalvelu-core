from __future__ import annotations

import pytest

from tests.factories import EquipmentFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__update__regular_user_cannot_update(graphql):
    equipment = EquipmentFactory.create(name="foo")

    data = {"pk": equipment.pk, "name": "bar", "category": equipment.category.pk}

    graphql.login_with_regular_user()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
