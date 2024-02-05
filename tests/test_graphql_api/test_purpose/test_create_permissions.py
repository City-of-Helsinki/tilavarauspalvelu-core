import pytest

from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_purpose__create__regular_user(graphql):
    data = {"nameFi": "foo"}

    graphql.login_user_based_on_type(UserType.REGULAR)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate"
