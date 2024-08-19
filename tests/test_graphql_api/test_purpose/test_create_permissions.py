import pytest

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__create__regular_user(graphql):
    data = {"name": "foo"}

    graphql.login_with_regular_user()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."
