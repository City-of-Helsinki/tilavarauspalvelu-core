from __future__ import annotations

import pytest

from tests.factories import EquipmentCategoryFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__create__regular_user(graphql):
    category = EquipmentCategoryFactory.create()
    data = {"name": "foo", "category": category.pk}

    graphql.login_with_regular_user()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."
