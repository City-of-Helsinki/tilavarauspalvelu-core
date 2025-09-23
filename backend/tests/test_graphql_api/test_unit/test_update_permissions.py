from __future__ import annotations

import pytest

from tests.factories import UnitFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__update__regular_user(graphql):
    unit = UnitFactory.create()
    graphql.login_with_regular_user()

    data = {"pk": unit.pk, "descriptionFi": "foo"}
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
