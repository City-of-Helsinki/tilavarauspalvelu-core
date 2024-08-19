import pytest

from tests.factories import ResourceFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_resource__delete__regular_user(graphql):
    resource = ResourceFactory.create()
    graphql.login_with_regular_user()

    response = graphql(DELETE_MUTATION, input_data={"pk": resource.pk})

    assert response.error_message() == "No permission to delete."
