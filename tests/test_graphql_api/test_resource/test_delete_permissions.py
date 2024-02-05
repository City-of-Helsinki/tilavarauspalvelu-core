import pytest

from tests.factories import ResourceFactory
from tests.helpers import UserType

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__delete__regular_user(graphql):
    resource = ResourceFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.error_message() == "No permissions to perform delete."
