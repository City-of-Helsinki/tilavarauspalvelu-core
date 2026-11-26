from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import UnitFactory

from .helpers import UPDATE_MUTATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__update(graphql: GraphQLClient) -> None:
    unit = UnitFactory.create()
    graphql.login_with_superuser()

    data = {"pk": unit.pk, "descriptionFi": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    unit.refresh_from_db()
    assert unit.description_fi == "foo"
