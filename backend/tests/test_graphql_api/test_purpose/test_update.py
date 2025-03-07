from __future__ import annotations

import pytest

from tests.factories import PurposeFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__update(graphql):
    purpose = PurposeFactory.create(name="foo")
    data = {"pk": purpose.pk, "nameFi": "bar"}

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    purpose.refresh_from_db()
    assert purpose.name_fi == "bar"
