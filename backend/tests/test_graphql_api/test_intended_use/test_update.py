from __future__ import annotations

import pytest

from tests.factories import IntendedUseFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_intended_use__update(graphql):
    intended_use = IntendedUseFactory.create(name="foo")
    data = {"pk": intended_use.pk, "nameFi": "bar"}

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    intended_use.refresh_from_db()
    assert intended_use.name_fi == "bar"
