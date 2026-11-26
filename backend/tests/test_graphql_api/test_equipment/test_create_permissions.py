from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import EquipmentCategoryFactory

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment__create__regular_user(graphql: GraphQLClient) -> None:
    category = EquipmentCategoryFactory.create()
    data = {"name": "foo", "category": category.pk}

    graphql.login_with_regular_user()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."
