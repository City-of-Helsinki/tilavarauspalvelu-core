from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.models import EquipmentCategory

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_equipment_category__create(graphql: GraphQLClient) -> None:
    data = {"name": "foo"}

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    category = EquipmentCategory.objects.get(pk=response.first_query_object["pk"])
    assert category.name_fi == "foo"


def test_equipment_category__create__empty_name(graphql: GraphQLClient) -> None:
    data = {"name": ""}

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("name") == ["This field may not be blank."]
    assert EquipmentCategory.objects.count() == 0
