from __future__ import annotations

import pytest

from tilavarauspalvelu.models import Space

from tests.factories import UnitFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_create_space(graphql):
    graphql.login_with_superuser()

    unit = UnitFactory.create()

    data = {
        "name": "foo",
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response
    assert Space.objects.count() == 1


def test_create_space__name_is_required(graphql):
    graphql.login_with_superuser()

    unit = UnitFactory.create()

    data = {
        "nameSv": "foo",
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Variable '$input'")
    assert Space.objects.count() == 0


def test_create_space__unit_is_required(graphql):
    graphql.login_with_superuser()

    UnitFactory.create()

    data = {
        "name": "foo",
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message().startswith("Variable '$input'")
    assert Space.objects.count() == 0


@pytest.mark.parametrize("value", ["", " "])
def test_create_space__name_cannot_be_empty(graphql, value):
    graphql.login_with_superuser()

    unit = UnitFactory.create()

    data = {
        "name": value,
        "unit": unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("name") == ["This field may not be blank."]
    assert Space.objects.count() == 0
