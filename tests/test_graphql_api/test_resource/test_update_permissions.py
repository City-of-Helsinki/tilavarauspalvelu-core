import pytest

from tests.factories import ResourceFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__update__regular_user(graphql):
    resource = ResourceFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {
        "pk": resource.pk,
        "name": "a",
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
