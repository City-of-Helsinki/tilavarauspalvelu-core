import pytest

from tilavarauspalvelu.models import Purpose

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__create(graphql):
    data = {"name": "foo"}

    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    purpose = Purpose.objects.get(pk=response.first_query_object["pk"])
    assert purpose.name_fi == "foo"
