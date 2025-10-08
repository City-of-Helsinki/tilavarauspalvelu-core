from __future__ import annotations

import pytest

from tilavarauspalvelu.models import IntendedUse

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_intended_use__create(graphql):
    data = {"name": "foo"}

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    intended_use = IntendedUse.objects.get(pk=response.first_query_object["pk"])
    assert intended_use.name_fi == "foo"
