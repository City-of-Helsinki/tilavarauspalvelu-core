from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import EquipmentCategoryFactory

from .helpers import UPDATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__update__regular_user_cannot_update(graphql: GraphQLClient) -> None:
    category = EquipmentCategoryFactory.create(name="foo")
    data = {"pk": category.pk, "name": "bar"}

    graphql.login_with_regular_user()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
