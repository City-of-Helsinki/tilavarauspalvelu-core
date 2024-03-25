import pytest

from reservation_units.models import Purpose
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__create(graphql):
    data = {"name": "foo"}

    graphql.login_user_based_on_type(UserType.SUPERUSER)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    purpose = Purpose.objects.get(pk=response.first_query_object["pk"])
    assert purpose.name_fi == "foo"
