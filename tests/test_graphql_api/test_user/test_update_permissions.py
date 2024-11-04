import pytest

from tests.factories import UserFactory
from tilavarauspalvelu.enums import Language

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__update__language__superuser(graphql):
    user = UserFactory.create_superuser()

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False


def test_user__update__language__regular_user(graphql):
    user = UserFactory.create()

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False


def test_user__update__language__admin(graphql):
    user = UserFactory.create_with_general_role()

    data = {
        "preferredLanguage": Language.FI.value.upper(),
    }

    graphql.force_login(user)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False
